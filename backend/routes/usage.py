from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from db import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/usage", tags=["usage"])

# Helper function for Pydantic v1/v2 compatibility
def to_pydantic(model_class, obj):
    """Convert SQLAlchemy model to Pydantic model, compatible with both v1 and v2."""
    try:
        # Pydantic v2
        return model_class.model_validate(obj)
    except AttributeError:
        # Pydantic v1
        return model_class.from_orm(obj)

@router.get("", response_model=list[schemas.UsageOut])
def list_usage(
    cohort_id: str | None = Query(None),
    project_id: str | None = Query(None),
    user_id: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can view usage")

    query = db.query(models.TaskVersion)
    if project_id:
        query = query.filter(models.TaskVersion.project_id == project_id)
    if user_id:
        query = query.filter(models.TaskVersion.user_id == user_id)
    if cohort_id:
        query = query.join(models.CohortMember, models.CohortMember.user_id == models.TaskVersion.user_id)
        query = query.filter(models.CohortMember.cohort_id == cohort_id)

    tasks = query.order_by(desc(models.TaskVersion.created_at)).limit(200).all()
    results: list[schemas.UsageOut] = []
    for t in tasks:
        user = db.query(models.User).filter(models.User.id == t.user_id).first()
        if not user:
            continue
        project = db.query(models.Project).filter(models.Project.id == t.project_id).first()
        results.append(
            schemas.UsageOut(
                id=t.id,
                user=to_pydantic(schemas.UserOut, user),
                project_id=t.project_id,
                project_title=project.title if project else None,
                task_type=t.task_type,
                created_at=int(t.created_at.timestamp() * 1000),
                cohort_id=cohort_id,
                target_doc_id=t.target_doc_id,
            )
        )
    return results

@router.post("", response_model=schemas.UsageOut)
def create_usage(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # TODO: 實現使用記錄創建邏輯
    # 目前可以通過 TaskVersion 來記錄使用情況
    # 如果需要單獨的使用記錄表，需要創建對應的模型
    raise HTTPException(status_code=501, detail="Not implemented yet")
