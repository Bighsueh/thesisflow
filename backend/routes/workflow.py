from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from auth_helpers import check_learning_task_access
from datetime import datetime

router = APIRouter(prefix="/api/learning_tasks", tags=["workflow"])

@router.get("/{learning_task_id}/workflow", response_model=schemas.WorkflowStateOut | None)
def get_workflow_state(
    learning_task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取當前用戶在指定學習任務中的 workflow 狀態"""
    # 驗證用戶有權訪問此學習任務
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    state = db.query(models.WorkflowState).filter(
        models.WorkflowState.learning_task_id == learning_task_id,
        models.WorkflowState.user_id == current_user.id
    ).first()
    
    if not state:
        return None
    
    return schemas.WorkflowStateOut(
        id=state.id,
        learning_task_id=state.learning_task_id,
        user_id=state.user_id,
        node_id=state.node_id,
        widget_state=state.widget_state or {},
        task_b_data=state.task_b_data or [],
        task_c_data=state.task_c_data or {},
        created_at=int(state.created_at.timestamp() * 1000),
        updated_at=int(state.updated_at.timestamp() * 1000),
    )

@router.post("/{learning_task_id}/workflow", response_model=schemas.WorkflowStateOut)
def create_or_update_workflow_state(
    learning_task_id: str,
    payload: schemas.WorkflowStateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """創建或更新 workflow 狀態（自動保存）"""
    # 檢查學習任務是否存在
    project = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Learning task not found")
    
    # 驗證用戶有權訪問此學習任務
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # 查找是否已存在狀態
    existing_state = db.query(models.WorkflowState).filter(
        models.WorkflowState.learning_task_id == learning_task_id,
        models.WorkflowState.user_id == current_user.id
    ).first()
    
    if existing_state:
        # 更新現有狀態
        if payload.node_id is not None:
            existing_state.node_id = payload.node_id
        if payload.widget_state is not None:
            existing_state.widget_state = payload.widget_state
        if payload.task_b_data is not None:
            existing_state.task_b_data = payload.task_b_data
        if payload.task_c_data is not None:
            existing_state.task_c_data = payload.task_c_data
        existing_state.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_state)
        
        return schemas.WorkflowStateOut(
            id=existing_state.id,
            learning_task_id=existing_state.learning_task_id,
            user_id=existing_state.user_id,
            node_id=existing_state.node_id,
            widget_state=existing_state.widget_state or {},
            task_b_data=existing_state.task_b_data or [],
            task_c_data=existing_state.task_c_data or {},
            created_at=int(existing_state.created_at.timestamp() * 1000),
            updated_at=int(existing_state.updated_at.timestamp() * 1000),
        )
    else:
        # 創建新狀態
        new_state = models.WorkflowState(
            learning_task_id=learning_task_id,
            user_id=current_user.id,
            node_id=payload.node_id,
            widget_state=payload.widget_state or {},
            task_b_data=payload.task_b_data or [],
            task_c_data=payload.task_c_data or {},
        )
        db.add(new_state)
        db.commit()
        db.refresh(new_state)
        
        return schemas.WorkflowStateOut(
            id=new_state.id,
            learning_task_id=new_state.learning_task_id,
            user_id=new_state.user_id,
            node_id=new_state.node_id,
            widget_state=new_state.widget_state or {},
            task_b_data=new_state.task_b_data or [],
            task_c_data=new_state.task_c_data or {},
            created_at=int(new_state.created_at.timestamp() * 1000),
            updated_at=int(new_state.updated_at.timestamp() * 1000),
        )

@router.put("/{learning_task_id}/workflow", response_model=schemas.WorkflowStateOut)
def update_workflow_state(
    learning_task_id: str,
    payload: schemas.WorkflowStateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """部分更新 workflow 狀態"""
    # 驗證用戶有權訪問此學習任務
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    state = db.query(models.WorkflowState).filter(
        models.WorkflowState.learning_task_id == learning_task_id,
        models.WorkflowState.user_id == current_user.id
    ).first()

    if not state:
        raise HTTPException(status_code=404, detail="Workflow state not found")

    if payload.node_id is not None:
        state.node_id = payload.node_id
    if payload.widget_state is not None:
        state.widget_state = {**(state.widget_state or {}), **payload.widget_state}
    if payload.task_b_data is not None:
        state.task_b_data = payload.task_b_data
    if payload.task_c_data is not None:
        state.task_c_data = {**(state.task_c_data or {}), **payload.task_c_data}

    state.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(state)

    return schemas.WorkflowStateOut(
        id=state.id,
        learning_task_id=state.learning_task_id,
        user_id=state.user_id,
        node_id=state.node_id,
        widget_state=state.widget_state or {},
        task_b_data=state.task_b_data or [],
        task_c_data=state.task_c_data or {},
        created_at=int(state.created_at.timestamp() * 1000),
        updated_at=int(state.updated_at.timestamp() * 1000),
    )


# ============ 新的簡化任務狀態端點 ============

@router.get("/{learning_task_id}/task-state", response_model=dict | None)
def get_task_state(
    learning_task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取當前用戶在指定學習任務中的簡化任務狀態"""
    # 驗證用戶有權訪問此學習任務
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    state = db.query(models.TaskState).filter(
        models.TaskState.learning_task_id == learning_task_id,
        models.TaskState.user_id == current_user.id
    ).first()

    if not state:
        return None

    return {
        "id": state.id,
        "learning_task_id": state.learning_task_id,
        "user_id": state.user_id,
        "summary_state": state.summary_state or {},
        "comparison_state": state.comparison_state or [],
        "created_at": int(state.created_at.timestamp() * 1000),
        "updated_at": int(state.updated_at.timestamp() * 1000),
    }


@router.post("/{learning_task_id}/task-state", response_model=dict)
def save_task_state(
    learning_task_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """創建或更新簡化的任務狀態"""
    # 檢查學習任務是否存在
    project = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Learning task not found")
    
    # 驗證用戶有權訪問此學習任務
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # 查找是否已存在狀態
    existing_state = db.query(models.TaskState).filter(
        models.TaskState.learning_task_id == learning_task_id,
        models.TaskState.user_id == current_user.id
    ).first()

    if existing_state:
        # 更新現有狀態
        if "summary_state" in payload:
            existing_state.summary_state = payload["summary_state"]
        if "comparison_state" in payload:
            existing_state.comparison_state = payload["comparison_state"]
        existing_state.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_state)
    else:
        # 創建新狀態
        new_state = models.TaskState(
            learning_task_id=learning_task_id,
            user_id=current_user.id,
            summary_state=payload.get("summary_state", {}),
            comparison_state=payload.get("comparison_state", []),
        )
        db.add(new_state)
        db.commit()
        db.refresh(new_state)
        existing_state = new_state

    return {
        "id": existing_state.id,
        "learning_task_id": existing_state.learning_task_id,
        "user_id": existing_state.user_id,
        "summary_state": existing_state.summary_state or {},
        "comparison_state": existing_state.comparison_state or [],
        "created_at": int(existing_state.created_at.timestamp() * 1000),
        "updated_at": int(existing_state.updated_at.timestamp() * 1000),
    }
