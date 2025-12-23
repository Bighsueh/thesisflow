from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/highlights", tags=["highlights"])

@router.post("", response_model=schemas.HighlightOut)
def add_highlight(
    payload: schemas.HighlightCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(models.Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 驗證權限：檢查文檔是否屬於用戶的專案
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
                raise HTTPException(status_code=403, detail="Forbidden")
    
    highlight = models.Highlight(
        document_id=payload.document_id,
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
    
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
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
    
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
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
    
    if current_user.role == "student":
        if doc.project_id:
            cohort_ids = [m.cohort_id for m in current_user.memberships]
            cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if doc.project_id not in project_ids:
                raise HTTPException(status_code=403, detail="Forbidden")
    
    db.delete(highlight)
    db.commit()
    return {"deleted": True}
