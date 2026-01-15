from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from auth_helpers import check_learning_task_access
from services import AzureOpenAIClient

router = APIRouter(prefix="/api/learning_tasks", tags=["tasks"])

@router.post("/{learning_task_id}/tasks/A", response_model=schemas.TaskResponse)
async def submit_task_a(
    learning_task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Learning task not found")
    
    # 驗證用戶有權訪問此專案
    if not check_project_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    target_doc_id = payload.get("target_doc_id")
    content = payload.get("content", {})
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.learning_task_id == learning_task_id,
        models.TaskVersion.task_type == "A",
        models.TaskVersion.target_doc_id == target_doc_id,
    ).count() + 1
    
    tv = models.TaskVersion(
        learning_task_id=learning_task_id,
        user_id=current_user.id,
        target_doc_id=target_doc_id,
        task_type="A",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    system_prompt = "你是論文寫作教練，檢核學生的填寫並提出改進建議。"
    user_prompt = f"Task A content: {content}"
    feedback = await azure.chat(system_prompt, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )

@router.post("/{learning_task_id}/tasks/B", response_model=schemas.TaskResponse)
async def submit_task_b(
    learning_task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Learning task not found")
    
    # 驗證用戶有權訪問此專案
    if not check_project_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    content = payload.get("content", [])
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.learning_task_id == learning_task_id,
        models.TaskVersion.task_type == "B",
    ).count() + 1
    
    tv = models.TaskVersion(
        learning_task_id=learning_task_id,
        user_id=current_user.id,
        target_doc_id=None,
        task_type="B",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    system_prompt = "你是論文寫作教練，檢核學生的填寫並提出改進建議。"
    user_prompt = f"Task B content: {content}"
    feedback = await azure.chat(system_prompt, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )

@router.post("/{learning_task_id}/tasks/C", response_model=schemas.TaskResponse)
async def submit_task_c(
    learning_task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Learning task not found")
    
    # 驗證用戶有權訪問此專案
    if not check_project_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    content = payload.get("content", {})
    
    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.learning_task_id == learning_task_id,
        models.TaskVersion.task_type == "C",
    ).count() + 1
    
    tv = models.TaskVersion(
        learning_task_id=learning_task_id,
        user_id=current_user.id,
        target_doc_id=None,
        task_type="C",
        version=version,
        content=content,
        is_valid=True,
        validation_errors=[],
    )
    
    # Call Azure for feedback
    azure = AzureOpenAIClient()
    system_prompt = "你是論文寫作教練，檢核學生的填寫並提出改進建議。"
    user_prompt = f"Task C content: {content}"
    feedback = await azure.chat(system_prompt, user_prompt)
    tv.feedback = feedback
    
    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(
        id=tv.id,
        feedback=tv.feedback,
        is_valid=tv.is_valid,
        validation_errors=tv.validation_errors or []
    )
