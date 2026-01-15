from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
from auth_helpers import get_user_accessible_learning_task_ids, check_learning_task_access

router = APIRouter(prefix="/api/learning_tasks", tags=["learning_tasks"])

@router.get("", response_model=list[schemas.LearningTaskOut])
def list_learning_tasks(
    cohort_id: str = Query(None, description="按群組 ID 過濾學習任務"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    教師：可以看到自己建立的所有教學流程（目前沒有 teacher_id 欄位，暫時回傳全部學習任務）。
    學生：只能看到自己「已加入學生群組」所對應到的學習任務。
    支援按 cohort_id 過濾。
    
    使用 auth_helpers 統一處理新舊架構的權限邏輯：
    - 新架構：LearningTaskCohort 多對多關聯表
    - 舊架構：LearningTask.cohort_id 和 Cohort.learning_task_id（向後兼容）
    """
    if current_user.role == "teacher":
        query = db.query(models.LearningTask)
        if cohort_id:
            # 教師按群組過濾時，需要同時支援新舊架構
            # 新架構：LearningTaskCohort
            try:
                ltc_learning_task_ids = {
                    ltc.learning_task_id for ltc in 
                    db.query(models.LearningTaskCohort).filter(models.LearningTaskCohort.cohort_id == cohort_id).all()
                }
            except Exception:
                ltc_learning_task_ids = set()
            
            # 舊架構：LearningTask.cohort_id
            old_learning_task_ids = {
                lt.id for lt in 
                db.query(models.LearningTask).filter(models.LearningTask.cohort_id == cohort_id).all()
            }
            
            all_learning_task_ids = ltc_learning_task_ids | old_learning_task_ids
            if all_learning_task_ids:
                query = query.filter(models.LearningTask.id.in_(all_learning_task_ids))
            else:
                query = query.filter(models.LearningTask.id == None)  # 空結果
        learning_tasks = query.all()
    else:
        # 學生：使用統一的權限檢查函數
        accessible_learning_task_ids = get_user_accessible_learning_task_ids(db, current_user)
        if not accessible_learning_task_ids:
            learning_tasks = []
        else:
            query = db.query(models.LearningTask).filter(models.LearningTask.id.in_(accessible_learning_task_ids))
            if cohort_id:
                # 進一步按 cohort_id 過濾（需同時支援新舊架構）
                try:
                    ltc_learning_task_ids = {
                        ltc.learning_task_id for ltc in 
                        db.query(models.LearningTaskCohort).filter(models.LearningTaskCohort.cohort_id == cohort_id).all()
                    }
                except Exception:
                    ltc_learning_task_ids = set()
                
                old_learning_task_ids = {
                    lt.id for lt in 
                    db.query(models.LearningTask).filter(models.LearningTask.cohort_id == cohort_id).all()
                }
                
                cohort_learning_task_ids = ltc_learning_task_ids | old_learning_task_ids
                query = query.filter(models.LearningTask.id.in_(cohort_learning_task_ids))
            learning_tasks = query.all()

    result = []
    for lt in learning_tasks:
        # 優先返回新的 task_config
        if lt.task_config:
            result.append(
                schemas.LearningTaskOut(
                    id=lt.id,
                    title=lt.title,
                    semester=lt.semester,
                    tags=lt.tags or [],
                    task_config=lt.task_config,
                    cohort_id=lt.cohort_id,
                    nodes=None,
                    edges=None,
                )
            )
        else:
            # 向後相容：如果沒有 task_config，返回舊的 nodes/edges
            nodes = [
                schemas.FlowNodePayload(
                    id=n.id,
                    type=n.type,
                    label=n.label,
                    config=n.config,
                    position=n.position,
                )
                for n in lt.flow_nodes
            ]
            edges = [
                schemas.FlowEdgePayload(
                    id=e.id,
                    source=e.source,
                    target=e.target,
                    data=e.data,
                )
                for e in lt.flow_edges
            ]
            result.append(
                schemas.LearningTaskOut(
                    id=lt.id,
                    title=lt.title,
                    semester=lt.semester,
                    tags=lt.tags or [],
                    task_config=None,
                    cohort_id=lt.cohort_id,
                    nodes=nodes,
                    edges=edges,
                )
            )
    return result

@router.post("", response_model=schemas.LearningTaskOut)
def create_learning_task(
    payload: schemas.LearningTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 新的方式：使用 task_config
    task_config = payload.task_config.dict() if payload.task_config else {}

    learning_task = models.LearningTask(
        title=payload.title,
        semester=payload.semester,
        tags=payload.tags,
        task_config=task_config,
        cohort_id=payload.cohort_id  # 新架構：學習任務屬於群組
    )
    db.add(learning_task)
    db.flush()

    # 向後相容：如果提供了 nodes/edges，仍然建立 FlowNode/FlowEdge
    if payload.nodes or payload.edges:
        for n in payload.nodes:
            db.add(models.FlowNode(
                id=n.id,
                learning_task_id=learning_task.id,
                type=n.type,
                label=n.label,
                config=n.config,
                position=n.position
            ))
        for e in payload.edges:
            db.add(models.FlowEdge(
                id=e.id,
                learning_task_id=learning_task.id,
                source=e.source,
                target=e.target,
                data=e.data
            ))

    db.commit()
    db.refresh(learning_task)
    return schemas.LearningTaskOut(
        id=learning_task.id,
        title=learning_task.title,
        semester=learning_task.semester,
        tags=learning_task.tags or [],
        task_config=learning_task.task_config,
        cohort_id=learning_task.cohort_id,
        nodes=payload.nodes if payload.nodes else None,
        edges=payload.edges if payload.edges else None,
    )

@router.get("/{learning_task_id}", response_model=schemas.LearningTaskOut)
def get_learning_task(
    learning_task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    learning_task = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not learning_task:
        raise HTTPException(status_code=404, detail="Learning task not found")

    # 使用統一的權限檢查函數（支援新舊架構）
    if not check_learning_task_access(db, current_user, learning_task_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # 優先返回新的 task_config
    if learning_task.task_config:
        return schemas.LearningTaskOut(
            id=learning_task.id,
            title=learning_task.title,
            semester=learning_task.semester,
            tags=learning_task.tags or [],
            task_config=learning_task.task_config,
            cohort_id=learning_task.cohort_id,
            nodes=None,
            edges=None,
        )
    else:
        # 向後相容：如果沒有 task_config，返回舊的 nodes/edges
        nodes = [
            schemas.FlowNodePayload(
                id=n.id,
                type=n.type,
                label=n.label,
                config=n.config,
                position=n.position,
            )
            for n in learning_task.flow_nodes
        ]
        edges = [
            schemas.FlowEdgePayload(
                id=e.id,
                source=e.source,
                target=e.target,
                data=e.data,
            )
            for e in learning_task.flow_edges
        ]
        return schemas.LearningTaskOut(
            id=learning_task.id,
            title=learning_task.title,
            semester=learning_task.semester,
            tags=learning_task.tags or [],
            task_config=None,
            cohort_id=learning_task.cohort_id,
            nodes=nodes,
            edges=edges,
        )

@router.put("/{learning_task_id}", response_model=schemas.LearningTaskOut)
def update_learning_task(
    learning_task_id: str,
    payload: schemas.LearningTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    learning_task = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).first()
    if not learning_task:
        raise HTTPException(status_code=404, detail="Learning task not found")

    # 更新基本欄位
    if payload.title is not None:
        learning_task.title = payload.title
    if payload.semester is not None:
        learning_task.semester = payload.semester
    if payload.tags is not None:
        learning_task.tags = payload.tags
    if payload.cohort_id is not None:
        learning_task.cohort_id = payload.cohort_id

    # 優先使用新的 task_config 方式
    if payload.task_config is not None:
        learning_task.task_config = payload.task_config.dict()
    elif payload.nodes is not None or payload.edges is not None:
        # 向後相容：如果提供 nodes/edges，替換 FlowNode/FlowEdge
        db.query(models.FlowNode).filter(models.FlowNode.learning_task_id == learning_task_id).delete()
        db.query(models.FlowEdge).filter(models.FlowEdge.learning_task_id == learning_task_id).delete()

        if payload.nodes:
            for n in payload.nodes:
                db.add(models.FlowNode(
                    id=n.id,
                    learning_task_id=learning_task.id,
                    type=n.type,
                    label=n.label,
                    config=n.config,
                    position=n.position
                ))

        if payload.edges:
            for e in payload.edges:
                db.add(models.FlowEdge(
                    id=e.id,
                    learning_task_id=learning_task.id,
                    source=e.source,
                    target=e.target,
                    data=e.data
                ))

    db.commit()
    db.refresh(learning_task)

    return schemas.LearningTaskOut(
        id=learning_task.id,
        title=learning_task.title,
        semester=learning_task.semester,
        tags=learning_task.tags or [],
        task_config=learning_task.task_config,
        cohort_id=learning_task.cohort_id,
        nodes=payload.nodes if payload.nodes else None,
        edges=payload.edges if payload.edges else None,
    )

@router.delete("/{learning_task_id}")
def delete_learning_task(
    learning_task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    deleted = db.query(models.LearningTask).filter(models.LearningTask.id == learning_task_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Learning task not found")
    return {"deleted": True}
