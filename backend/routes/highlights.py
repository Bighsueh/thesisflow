from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from auth_helpers import check_learning_task_access

router = APIRouter(prefix="/api/highlights", tags=["highlights"])


def _check_document_access(db: Session, user: models.User, doc: models.Document) -> bool:
    """檢查用戶是否有權訪問文檔（用於 Highlight 操作）"""
    if user.role == "teacher":
        return True
    # 如果文檔有綁定學習任務，檢查學習任務權限
    if doc.learning_task_id:
        return check_learning_task_access(db, user, doc.learning_task_id)
    # 如果文檔沒有綁定學習任務，檢查是否為文檔擁有者
    if doc.user_id:
        return doc.user_id == user.id
    # 沒有綁定學習任務也沒有擁有者的文檔（舊資料），允許訪問
    return True


@router.post("", response_model=schemas.HighlightOut)
def add_highlight(
    payload: schemas.HighlightCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 使用統一的權限檢查（支援新舊架構）
    if not _check_document_access(db, current_user, doc):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    highlight = models.Highlight(
        document_id=payload.document_id,
        user_id=current_user.id,  # 記錄建立者
        snippet=payload.snippet,
        name=payload.name,
        page=payload.page,
        x=payload.x,
        y=payload.y,
        width=payload.width,
        height=payload.height,
        evidence_type=payload.evidence_type,
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

@router.get("/{highlight_id}", response_model=schemas.HighlightOut)
def get_highlight(
    highlight_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    highlight = db.query(models.Highlight).filter(models.Highlight.id == highlight_id).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    # 驗證權限
    doc = db.query(models.Document).filter(models.Document.id == highlight.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 使用統一的權限檢查（支援新舊架構）
    if not _check_document_access(db, current_user, doc):
        raise HTTPException(status_code=403, detail="Forbidden")
    
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

@router.put("/{highlight_id}", response_model=schemas.HighlightOut)
def update_highlight(
    highlight_id: str,
    payload: schemas.HighlightUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    highlight = db.query(models.Highlight).filter(models.Highlight.id == highlight_id).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    # 驗證權限
    doc = db.query(models.Document).filter(models.Document.id == highlight.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 使用統一的權限檢查（支援新舊架構）
    if not _check_document_access(db, current_user, doc):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # 更新字段
    if payload.snippet is not None:
        highlight.snippet = payload.snippet
    if payload.name is not None:
        highlight.name = payload.name.strip() if payload.name.strip() else None
    if payload.page is not None:
        highlight.page = payload.page
    if payload.x is not None:
        highlight.x = payload.x
    if payload.y is not None:
        highlight.y = payload.y
    if payload.width is not None:
        highlight.width = payload.width
    if payload.height is not None:
        highlight.height = payload.height
    if payload.evidence_type is not None:
        highlight.evidence_type = payload.evidence_type
    
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

@router.delete("/{highlight_id}")
def delete_highlight(
    highlight_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    highlight = db.query(models.Highlight).filter(models.Highlight.id == highlight_id).first()
    if not highlight:
        raise HTTPException(status_code=404, detail="Highlight not found")
    
    # 驗證權限
    doc = db.query(models.Document).filter(models.Document.id == highlight.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 使用統一的權限檢查（支援新舊架構）
    if not _check_document_access(db, current_user, doc):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    db.delete(highlight)
    db.commit()
    return {"deleted": True}
