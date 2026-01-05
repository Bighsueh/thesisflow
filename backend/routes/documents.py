from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from sqlalchemy.orm import Session
from db import get_db, SessionLocal
import models
import schemas
from auth import get_current_user
from services import presign_upload, presign_get, get_s3_client
from rag_services import process_document_rag, delete_document_vectors, log_rag_event
import uuid
from datetime import datetime
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

# 檔案大小限制：100 MB
MAX_FILE_SIZE = 100 * 1024 * 1024


def process_rag_background(document_id: str, file_content: bytes):
    """背景執行 RAG 處理"""
    db = SessionLocal()
    try:
        # 狀態更新由 rag_services.process_document_rag 統一處理
        # 執行 RAG 處理
        success, error = process_document_rag(document_id, file_content, db)
        if not success:
            logger.warning(f"RAG processing failed for document {document_id}: {error}")
    except Exception as e:
        logger.error(f"RAG background processing error for document {document_id}: {e}")
        # 更新為失敗狀態
        doc = db.query(models.Document).filter(models.Document.id == document_id).first()
        if doc:
            doc.rag_status = "failed"
            doc.rag_error = str(e)[:500]
            db.commit()
    finally:
        db.close()

# Ensure forward refs are resolved (for Pydantic v1 compatibility)
try:
    schemas.DocumentOut.update_forward_refs()
except (AttributeError, TypeError):
    # Pydantic v2 uses model_rebuild() which should already be called in schemas.py
    pass

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=list[schemas.DocumentOut])
def list_documents(
    project_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        query = db.query(models.Document)
        if project_id:
            docs = query.filter(models.Document.project_id == project_id).all()
        else:
            docs = query.all()
        
        result = []
        for d in docs:
            try:
                highlights = []
                if d.highlights:
                    for h in d.highlights:
                        try:
                            highlights.append(
                                schemas.HighlightOut(
                                    id=h.id,
                                    document_id=h.document_id,
                                    snippet=h.snippet or "",
                                    name=h.name,
                                    page=h.page,
                                    x=h.x,
                                    y=h.y,
                                    width=h.width,
                                    height=h.height,
                                    evidence_type=h.evidence_type,
                                    created_at=int(h.created_at.timestamp() * 1000) if h.created_at else 0,
                                )
                            )
                        except Exception as h_err:
                            # 跳過有問題的 highlight，繼續處理其他
                            import traceback
                            print(f"Warning: Failed to serialize highlight {h.id if h else 'unknown'}: {h_err}")
                            traceback.print_exc()
                            continue
                
                result.append(
                    schemas.DocumentOut(
                        id=d.id,
                        project_id=d.project_id,
                        title=d.title,
                        object_key=d.object_key,
                        content_type=d.content_type,
                        size=d.size,
                        type=d.type,
                        uploaded_at=int(d.uploaded_at.timestamp() * 1000) if d.uploaded_at else 0,
                        raw_preview=d.raw_preview,
                        highlights=highlights,
                        rag_status=d.rag_status or "pending",
                        chunk_count=d.chunk_count or 0,
                    )
                )
            except Exception as e:
                import traceback
                print(f"Warning: Failed to serialize document {d.id if d else 'unknown'}: {e}")
                traceback.print_exc()
                # 跳過有問題的文檔，繼續處理其他
                continue
        
        return result
    except Exception as e:
        import traceback
        print(f"Error in list_documents: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")

@router.post("", response_model=schemas.DocumentOut)
def create_document(
    payload: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = models.Document(
        project_id=payload.project_id,
        title=payload.title,
        object_key=payload.object_key,
        content_type=payload.content_type,
        size=payload.size,
        type=payload.type,
        raw_preview=payload.raw_preview,
        rag_status="pending" if payload.type == "pdf" else "not_applicable",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return schemas.DocumentOut(
        id=doc.id,
        project_id=doc.project_id,
        title=doc.title,
        object_key=doc.object_key,
        content_type=doc.content_type,
        size=doc.size,
        type=doc.type,
        uploaded_at=int(doc.uploaded_at.timestamp() * 1000),
        raw_preview=doc.raw_preview,
        highlights=[],
        rag_status=doc.rag_status or "pending",
        chunk_count=doc.chunk_count or 0,
    )

@router.post("/upload", response_model=schemas.DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 檢查 Content-Length header（快速拒絕過大檔案）
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"檔案大小超過限制 ({MAX_FILE_SIZE // (1024 * 1024)} MB)"
        )

    # 生成 object_key
    object_key = f"uploads/{uuid.uuid4()}_{file.filename}"

    # 實際上傳文件到 MinIO
    try:
        bucket = os.getenv("MINIO_BUCKET")
        s3_client = get_s3_client()

        # 確保 bucket 存在
        try:
            s3_client.head_bucket(Bucket=bucket)
        except s3_client.exceptions.ClientError:
            # Bucket 不存在，嘗試創建
            try:
                s3_client.create_bucket(Bucket=bucket)
            except Exception as create_err:
                print(f"Warning: Could not create bucket {bucket}: {create_err}")

        # 分塊讀取文件內容並檢查大小
        chunks = []
        total_size = 0
        while True:
            chunk = await file.read(1024 * 1024)  # 每次讀取 1 MB
            if not chunk:
                break
            total_size += len(chunk)
            if total_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=413,
                    detail=f"檔案大小超過限制 ({MAX_FILE_SIZE // (1024 * 1024)} MB)"
                )
            chunks.append(chunk)

        file_content = b''.join(chunks)
        
        # 上傳到 MinIO
        s3_client.put_object(
            Bucket=bucket,
            Key=object_key,
            Body=file_content,
            ContentType=file.content_type or "application/octet-stream"
        )
        
        # 驗證上傳成功
        try:
            s3_client.head_object(Bucket=bucket, Key=object_key)
        except Exception as verify_err:
            print(f"Warning: Could not verify uploaded file {object_key}: {verify_err}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload file to MinIO: {str(e)}")
    
    # 確定文檔類型
    doc_type = "text"
    if file.content_type == "application/pdf":
        doc_type = "pdf"
    elif file.content_type and file.content_type.startswith("text/"):
        doc_type = "text"
    else:
        doc_type = "file"
    
    doc = models.Document(
        project_id=None,
        title=title,
        object_key=object_key,
        content_type=file.content_type,
        size=file.size,
        type=doc_type,
        raw_preview=None,
        rag_status="pending" if doc_type == "pdf" else "not_applicable",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 若為 PDF，背景執行 RAG 處理（非同步）
    if doc_type == "pdf":
        log_rag_event(db, doc.id, "upload", "success", "檔案上傳完成，等待處理", {"size": file.size})
        background_tasks.add_task(process_rag_background, doc.id, file_content)

    return schemas.DocumentOut(
        id=doc.id,
        project_id=doc.project_id,
        title=doc.title,
        object_key=doc.object_key,
        content_type=doc.content_type,
        size=doc.size,
        type=doc.type,
        uploaded_at=int(doc.uploaded_at.timestamp() * 1000),
        raw_preview=doc.raw_preview,
        highlights=[],
        rag_status=doc.rag_status or "pending",
        chunk_count=doc.chunk_count or 0,
    )

@router.post("/bind")
def bind_documents(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    document_ids = payload.get("document_ids", [])
    project_id = payload.get("project_id")
    
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    
    # 驗證專案存在
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 更新文檔的 project_id
    updated = db.query(models.Document).filter(
        models.Document.id.in_(document_ids)
    ).update({"project_id": project_id}, synchronize_session=False)
    
    db.commit()
    return {"bound": updated}

@router.post("/unbind")
def unbind_documents(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    document_ids = payload.get("document_ids", [])
    
    # 將文檔的 project_id 設為 None
    updated = db.query(models.Document).filter(
        models.Document.id.in_(document_ids)
    ).update({"project_id": None}, synchronize_session=False)
    
    db.commit()
    return {"unbound": updated}

@router.patch("/{doc_id}", response_model=schemas.DocumentOut)
def update_document(
    doc_id: str,
    payload: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    # 無條件更新 project_id（包括設為 None 以解除綁定）
    doc.project_id = payload.project_id
    db.commit()
    db.refresh(doc)
    highlights = [
        schemas.HighlightOut(
            id=h.id,
            document_id=h.document_id,
            snippet=h.snippet,
            name=h.name,
            page=h.page,
            x=h.x,
            y=h.y,
            width=h.width,
            height=h.height,
            evidence_type=h.evidence_type,
            created_at=int(h.created_at.timestamp() * 1000),
        )
        for h in doc.highlights
    ]
    return schemas.DocumentOut(
        id=doc.id,
        project_id=doc.project_id,
        title=doc.title,
        object_key=doc.object_key,
        content_type=doc.content_type,
        size=doc.size,
        type=doc.type,
        uploaded_at=int(doc.uploaded_at.timestamp() * 1000),
        raw_preview=doc.raw_preview,
        highlights=highlights,
        rag_status=doc.rag_status or "pending",
        chunk_count=doc.chunk_count or 0,
    )

@router.post("/{doc_id}/highlights", response_model=schemas.HighlightOut)
def add_highlight_to_document(
    doc_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 驗證權限
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
                raise HTTPException(status_code=403, detail="Forbidden")
    
    highlight = models.Highlight(
        document_id=doc_id,
        snippet=payload.get("snippet", ""),
        name=payload.get("name"),
        page=payload.get("page"),
        x=payload.get("x"),
        y=payload.get("y"),
        width=payload.get("width"),
        height=payload.get("height"),
        evidence_type=payload.get("evidence_type"),
    )
    db.add(highlight)
    db.commit()
    db.refresh(highlight)
    return schemas.HighlightOut(
        id=highlight.id,
        document_id=highlight.document_id,
        snippet=highlight.snippet,
        name=highlight.name,
        page=highlight.page,
        x=highlight.x,
        y=highlight.y,
        width=highlight.width,
        height=highlight.height,
        evidence_type=highlight.evidence_type,
        created_at=int(highlight.created_at.timestamp() * 1000),
    )

@router.delete("/{doc_id}/highlights")
def delete_all_highlights_for_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """批量刪除文檔的所有證據（用於清理範例資料）"""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 驗證權限
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
                raise HTTPException(status_code=403, detail="Forbidden")
    
    deleted_count = db.query(models.Highlight).filter(models.Highlight.document_id == doc_id).delete()
    db.commit()
    return {"deleted": deleted_count}


@router.get("/{doc_id}/rag-logs", response_model=list[schemas.RagProcessingLogOut])
def get_document_rag_logs(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    logs = db.query(models.RagProcessingLog)\
        .filter(models.RagProcessingLog.document_id == doc_id)\
        .order_by(models.RagProcessingLog.created_at.asc())\
        .all()
    
    return logs


@router.delete("/{doc_id}")
def delete_document(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 先刪除 ChromaDB 中的向量資料
    try:
        deleted_vectors = delete_document_vectors(doc_id)
        if deleted_vectors > 0:
            logger.info(f"Deleted {deleted_vectors} vectors for document {doc_id}")
    except Exception as e:
        logger.warning(f"Failed to delete vectors for document {doc_id}: {e}")
        # 向量刪除失敗不影響文檔刪除

    deleted = db.query(models.Document).filter(models.Document.id == doc_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": True}
