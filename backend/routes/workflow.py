from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/api/projects", tags=["workflow"])

@router.get("/{project_id}/workflow", response_model=schemas.WorkflowStateOut | None)
def get_workflow_state(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """獲取當前用戶在指定專案中的 workflow 狀態"""
    state = db.query(models.WorkflowState).filter(
        models.WorkflowState.project_id == project_id,
        models.WorkflowState.user_id == current_user.id
    ).first()
    
    if not state:
        return None
    
    return schemas.WorkflowStateOut(
        id=state.id,
        project_id=state.project_id,
        user_id=state.user_id,
        node_id=state.node_id,
        widget_state=state.widget_state or {},
        task_b_data=state.task_b_data or [],
        task_c_data=state.task_c_data or {},
        created_at=int(state.created_at.timestamp() * 1000),
        updated_at=int(state.updated_at.timestamp() * 1000),
    )

@router.post("/{project_id}/workflow", response_model=schemas.WorkflowStateOut)
def create_or_update_workflow_state(
    project_id: str,
    payload: schemas.WorkflowStateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """創建或更新 workflow 狀態（自動保存）"""
    # 檢查專案是否存在
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # 查找是否已存在狀態
    existing_state = db.query(models.WorkflowState).filter(
        models.WorkflowState.project_id == project_id,
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
            project_id=existing_state.project_id,
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
            project_id=project_id,
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
            project_id=new_state.project_id,
            user_id=new_state.user_id,
            node_id=new_state.node_id,
            widget_state=new_state.widget_state or {},
            task_b_data=new_state.task_b_data or [],
            task_c_data=new_state.task_c_data or {},
            created_at=int(new_state.created_at.timestamp() * 1000),
            updated_at=int(new_state.updated_at.timestamp() * 1000),
        )

@router.put("/{project_id}/workflow", response_model=schemas.WorkflowStateOut)
def update_workflow_state(
    project_id: str,
    payload: schemas.WorkflowStateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """部分更新 workflow 狀態"""
    state = db.query(models.WorkflowState).filter(
        models.WorkflowState.project_id == project_id,
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
        project_id=state.project_id,
        user_id=state.user_id,
        node_id=state.node_id,
        widget_state=state.widget_state or {},
        task_b_data=state.task_b_data or [],
        task_c_data=state.task_c_data or {},
        created_at=int(state.created_at.timestamp() * 1000),
        updated_at=int(state.updated_at.timestamp() * 1000),
    )
