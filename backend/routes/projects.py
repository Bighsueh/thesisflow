from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(
    cohort_id: str = Query(None, description="按群組 ID 過濾專案"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    教師：可以看到自己建立的所有教學流程（目前沒有 teacher_id 欄位，暫時回傳全部專案）。
    學生：只能看到自己「已加入學生群組」所對應到的專案。
    支援按 cohort_id 過濾。
    """
    if current_user.role == "teacher":
        query = db.query(models.Project)
        if cohort_id:
            query = query.filter(models.Project.cohort_id == cohort_id)
        projects = query.all()
    else:
        # 學生：取得所在群組的所有專案（新架構：透過 Project.cohort_id）
        cohort_ids = [m.cohort_id for m in current_user.memberships]
        if not cohort_ids:
            projects = []
        else:
            # 新架構：直接查詢 cohort_id 在學生所屬群組中的專案
            query = db.query(models.Project).filter(models.Project.cohort_id.in_(cohort_ids))
            if cohort_id:
                query = query.filter(models.Project.cohort_id == cohort_id)
            projects = query.all()
                
        # 向後兼容：同時查詢舊架構（Cohort.project_id）的專案
        cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
        legacy_project_ids = {c.project_id for c in cohorts if c.project_id}
        if legacy_project_ids:
            legacy_projects = db.query(models.Project).filter(
                models.Project.id.in_(legacy_project_ids)
            ).all()
            # 合併結果，避免重複
            existing_ids = {p.id for p in projects}
            for lp in legacy_projects:
                if lp.id not in existing_ids:
                    projects.append(lp)

    result = []
    for p in projects:
        # 優先返回新的 task_config
        if p.task_config:
            result.append(
                schemas.ProjectOut(
                    id=p.id,
                    title=p.title,
                    semester=p.semester,
                    tags=p.tags or [],
                    task_config=p.task_config,
                    cohort_id=p.cohort_id,
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
                for n in p.flow_nodes
            ]
            edges = [
                schemas.FlowEdgePayload(
                    id=e.id,
                    source=e.source,
                    target=e.target,
                    data=e.data,
                )
                for e in p.flow_edges
            ]
            result.append(
                schemas.ProjectOut(
                    id=p.id,
                    title=p.title,
                    semester=p.semester,
                    tags=p.tags or [],
                    task_config=None,
                    cohort_id=p.cohort_id,
                    nodes=nodes,
                    edges=edges,
                )
            )
    return result

@router.post("", response_model=schemas.ProjectOut)
def create_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 新的方式：使用 task_config
    task_config = payload.task_config.dict() if payload.task_config else {}

    project = models.Project(
        title=payload.title,
        semester=payload.semester,
        tags=payload.tags,
        task_config=task_config,
        cohort_id=payload.cohort_id  # 新架構：專案屬於群組
    )
    db.add(project)
    db.flush()

    # 向後相容：如果提供了 nodes/edges，仍然建立 FlowNode/FlowEdge
    if payload.nodes or payload.edges:
        for n in payload.nodes:
            db.add(models.FlowNode(
                id=n.id,
                project_id=project.id,
                type=n.type,
                label=n.label,
                config=n.config,
                position=n.position
            ))
        for e in payload.edges:
            db.add(models.FlowEdge(
                id=e.id,
                project_id=project.id,
                source=e.source,
                target=e.target,
                data=e.data
            ))

    db.commit()
    db.refresh(project)
    return schemas.ProjectOut(
        id=project.id,
        title=project.title,
        semester=project.semester,
        tags=project.tags or [],
        task_config=project.task_config,
        cohort_id=project.cohort_id,
        nodes=payload.nodes if payload.nodes else None,
        edges=payload.edges if payload.edges else None,
    )

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 驗證權限
    if current_user.role == "student":
        cohort_ids = [m.cohort_id for m in current_user.memberships]
        cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
        project_ids = {c.project_id for c in cohorts if c.project_id}
        if project_id not in project_ids:
            raise HTTPException(status_code=403, detail="Forbidden")

    # 優先返回新的 task_config
    if project.task_config:
        return schemas.ProjectOut(
            id=project.id,
            title=project.title,
            semester=project.semester,
            tags=project.tags or [],
            task_config=project.task_config,
            cohort_id=project.cohort_id,
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
            for n in project.flow_nodes
        ]
        edges = [
            schemas.FlowEdgePayload(
                id=e.id,
                source=e.source,
                target=e.target,
                data=e.data,
            )
            for e in project.flow_edges
        ]
        return schemas.ProjectOut(
            id=project.id,
            title=project.title,
            semester=project.semester,
            tags=project.tags or [],
            task_config=None,
            cohort_id=project.cohort_id,
            nodes=nodes,
            edges=edges,
        )

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(
    project_id: str,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 更新基本欄位
    if payload.title is not None:
        project.title = payload.title
    if payload.semester is not None:
        project.semester = payload.semester
    if payload.tags is not None:
        project.tags = payload.tags
    if payload.cohort_id is not None:
        project.cohort_id = payload.cohort_id

    # 優先使用新的 task_config 方式
    if payload.task_config is not None:
        project.task_config = payload.task_config.dict()
    elif payload.nodes is not None or payload.edges is not None:
        # 向後相容：如果提供 nodes/edges，替換 FlowNode/FlowEdge
        db.query(models.FlowNode).filter(models.FlowNode.project_id == project_id).delete()
        db.query(models.FlowEdge).filter(models.FlowEdge.project_id == project_id).delete()

        if payload.nodes:
            for n in payload.nodes:
                db.add(models.FlowNode(
                    id=n.id,
                    project_id=project.id,
                    type=n.type,
                    label=n.label,
                    config=n.config,
                    position=n.position
                ))

        if payload.edges:
            for e in payload.edges:
                db.add(models.FlowEdge(
                    id=e.id,
                    project_id=project.id,
                    source=e.source,
                    target=e.target,
                    data=e.data
                ))

    db.commit()
    db.refresh(project)

    return schemas.ProjectOut(
        id=project.id,
        title=project.title,
        semester=project.semester,
        tags=project.tags or [],
        task_config=project.task_config,
        cohort_id=project.cohort_id,
        nodes=payload.nodes if payload.nodes else None,
        edges=payload.edges if payload.edges else None,
    )

@router.delete("/{project_id}")
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    deleted = db.query(models.Project).filter(models.Project.id == project_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"deleted": True}
