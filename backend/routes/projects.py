from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    教師：可以看到自己建立的所有教學流程（目前沒有 teacher_id 欄位，暫時回傳全部專案）。
    學生：只能看到自己「已加入學生群組」所對應到的專案。
    """
    if current_user.role == "teacher":
        projects = db.query(models.Project).all()
    else:
        # 取得學生所在的所有 cohort，並收集對應的 project_id
        cohort_ids = [m.cohort_id for m in current_user.memberships]
        if not cohort_ids:
            projects = []
        else:
            cohorts = (
                db.query(models.Cohort)
                .filter(models.Cohort.id.in_(cohort_ids))
                .all()
            )
            project_ids = {c.project_id for c in cohorts if c.project_id}
            if not project_ids:
                projects = []
            else:
                projects = (
                    db.query(models.Project)
                    .filter(models.Project.id.in_(project_ids))
                    .all()
                )

    result = []
    for p in projects:
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
    project = models.Project(title=payload.title, semester=payload.semester, tags=payload.tags)
    db.add(project)
    db.flush()
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
        nodes=payload.nodes,
        edges=payload.edges,
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
    project.title = payload.title
    project.semester = payload.semester
    project.tags = payload.tags
    # replace flow
    db.query(models.FlowNode).filter(models.FlowNode.project_id == project_id).delete()
    db.query(models.FlowEdge).filter(models.FlowEdge.project_id == project_id).delete()
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
        nodes=payload.nodes,
        edges=payload.edges,
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
