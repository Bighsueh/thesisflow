import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from sqlalchemy import desc
import json
import time
import traceback
from db import Base, engine, get_db
import models
import schemas
from services import presign_upload, presign_get, AzureOpenAIClient
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)

# 嘗試多個可能的路徑來載入環境變數
# 從 backend 目錄運行時使用 env.local
# 從項目根目錄運行時使用 backend/env.local
_env_paths = [
    "env.local",
    "backend/env.local",
    os.path.join(os.path.dirname(__file__), "env.local"),
]
for _env_path in _env_paths:
    if os.path.exists(_env_path):
        load_dotenv(_env_path)
        break

# Auto-migrate: Add missing columns to highlights table if they don't exist
def auto_migrate_highlights_table():
    """Automatically add missing columns to highlights table if they don't exist."""
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            # 檢查並添加所有需要的欄位
            columns_to_add = [
                ("name", "VARCHAR"),
                ("x", "FLOAT"),
                ("y", "FLOAT"),
                ("width", "FLOAT"),
                ("height", "FLOAT"),
                ("evidence_type", "VARCHAR"),
            ]
            
            for column_name, column_type in columns_to_add:
                check_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'highlights' 
                    AND column_name = :column_name
                """)
                result = conn.execute(check_query, {"column_name": column_name})
                row = result.fetchone()
                
                if row is None:
                    alter_query = text(f"ALTER TABLE highlights ADD COLUMN {column_name} {column_type}")
                    conn.execute(alter_query)
                    print(f"✓ Auto-migrated: Added '{column_name}' column to highlights table")
            
            print("✓ Highlights table migration check completed")
    except Exception as e:
        print(f"Warning: Auto-migration failed: {e}")
        import traceback
        traceback.print_exc()

# Run auto-migration before creating tables
# 先執行 migration（針對現有資料庫）
auto_migrate_highlights_table()

# 然後建立所有表格（針對新資料庫）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ThesisFlow API")

# 動態設定 CORS 允許的來源
# 如果設定了 FRONTEND_DOMAIN，則使用該 domain
# 否則使用預設的 localhost 列表
FRONTEND_DOMAIN = os.getenv("FRONTEND_DOMAIN", "").strip()
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "3000").strip()

ALLOW_ORIGINS = []

if FRONTEND_DOMAIN:
    # 生產環境：使用設定的 domain
    # 支援 http 和 https
    if FRONTEND_DOMAIN.startswith("http://") or FRONTEND_DOMAIN.startswith("https://"):
        ALLOW_ORIGINS.append(FRONTEND_DOMAIN)
    else:
        # 如果沒有協議，預設使用 https
        ALLOW_ORIGINS.append(f"https://{FRONTEND_DOMAIN}")
        ALLOW_ORIGINS.append(f"http://{FRONTEND_DOMAIN}")
else:
    # 開發環境：使用預設的 localhost 列表
    ALLOW_ORIGINS = [
        # 常見開發環境
        f"http://localhost:{FRONTEND_PORT}",
        f"http://127.0.0.1:{FRONTEND_PORT}",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # 使用者有時會在網址列輸入帶大寫的 Localhost，FastAPI 會視為不同 origin
        f"http://Localhost:{FRONTEND_PORT}",
        "http://Localhost:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
from fastapi import Request

# 全局異常處理器
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

@app.get("/health")
def health():
    return {"status": "ok"}


# Auth
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.email == user.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    u = models.User(email=user.email, name=user.name, role=user.role, password_hash=get_password_hash(user.password))
    db.add(u)
    db.commit()
    db.refresh(u)
    return schemas.UserOut.model_validate(u)


@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(form: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, form.email, form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.id})
    return schemas.TokenResponse(access_token=token, user=schemas.UserOut.model_validate(user))


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.model_validate(current_user)


# Students (managed by teacher)
@app.get("/api/students", response_model=list[schemas.UserOut])
def list_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can list students")
    students = db.query(models.User).filter(models.User.role == "student").order_by(models.User.created_at.desc()).all()
    return [schemas.UserOut.model_validate(u) for u in students]


@app.post("/api/students", response_model=schemas.UserOut)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create student")
    exists = db.query(models.User).filter(models.User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")
    u = models.User(email=payload.email, name=payload.name, role="student", password_hash=get_password_hash(payload.password))
    db.add(u)
    db.commit()
    db.refresh(u)
    return schemas.UserOut.model_validate(u)


@app.post("/api/students/bulk", response_model=list[schemas.UserOut])
def bulk_create_students(payload: schemas.BulkStudentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create student")
    if payload.start_no > payload.end_no:
        raise HTTPException(status_code=400, detail="start_no must be <= end_no")

    created: list[schemas.UserOut] = []
    for n in range(payload.start_no, payload.end_no + 1):
        seat = str(n).zfill(payload.zero_pad or 1)
        email = f"{payload.email_prefix}{seat}{payload.email_domain}"
        name = f"{payload.name_prefix}{seat}"

        exists = db.query(models.User).filter(models.User.email == email).first()
        if exists:
            continue
        u = models.User(
            email=email,
            name=name,
            role="student",
            password_hash=get_password_hash(payload.password),
        )
        db.add(u)
        db.flush()
        created.append(schemas.UserOut.model_validate(u))

    db.commit()
    return created

@app.put("/api/students/{student_id}", response_model=schemas.UserOut)
def update_student(student_id: str, payload: schemas.StudentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can update student")
    user = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    if payload.email:
        exists = db.query(models.User).filter(models.User.email == payload.email, models.User.id != student_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = payload.email
    if payload.name:
        user.name = payload.name
    if payload.password:
        user.password_hash = get_password_hash(payload.password)
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user)


@app.delete("/api/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can delete student")
    deleted = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"deleted": True}


# Projects
@app.get("/api/projects", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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


@app.post("/api/projects", response_model=schemas.ProjectOut)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    project = models.Project(title=payload.title, semester=payload.semester, tags=payload.tags)
    db.add(project)
    db.flush()
    for n in payload.nodes:
        db.add(models.FlowNode(id=n.id, project_id=project.id, type=n.type, label=n.label, config=n.config, position=n.position))
    for e in payload.edges:
        db.add(models.FlowEdge(id=e.id, project_id=project.id, source=e.source, target=e.target, data=e.data))
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


@app.put("/api/projects/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: str, payload: schemas.ProjectUpdate, db: Session = Depends(get_db)):
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
        db.add(models.FlowNode(id=n.id, project_id=project.id, type=n.type, label=n.label, config=n.config, position=n.position))
    for e in payload.edges:
        db.add(models.FlowEdge(id=e.id, project_id=project.id, source=e.source, target=e.target, data=e.data))
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


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    deleted = db.query(models.Project).filter(models.Project.id == project_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"deleted": True}


# Documents
@app.get("/api/documents", response_model=list[schemas.DocumentOut])
def list_documents(project_id: str | None = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        query = db.query(models.Document)
        docs = query.filter(models.Document.project_id == project_id).all() if project_id else query.all()
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
                            )
                        except Exception as h_err:
                            # 跳過有問題的 highlight，繼續處理其他
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
                        uploaded_at=int(d.uploaded_at.timestamp() * 1000),
                        raw_preview=d.raw_preview,
                        highlights=highlights,
                    )
                )
            except Exception as e:
                raise
        return result
    except Exception as e:
        raise


@app.post("/api/documents", response_model=schemas.DocumentOut)
def create_document(payload: schemas.DocumentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = models.Document(
        project_id=payload.project_id,
        title=payload.title,
        object_key=payload.object_key,
        content_type=payload.content_type,
        size=payload.size,
        type=payload.type,
        raw_preview=payload.raw_preview,
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
    )


@app.patch("/api/documents/{doc_id}", response_model=schemas.DocumentOut)
def update_document(doc_id: str, payload: schemas.DocumentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
    )


# Highlights
@app.post("/api/highlights", response_model=schemas.HighlightOut)
def add_highlight(payload: schemas.HighlightCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == payload.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 驗證權限：檢查文檔是否屬於用戶的專案
    if current_user.role == "student":
        # 學生只能操作自己專案中的文檔
        if doc.project_id:
            project = db.query(models.Project).filter(models.Project.id == doc.project_id).first()
            if project:
                # 檢查學生是否在該專案的群組中
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


@app.get("/api/highlights/{highlight_id}", response_model=schemas.HighlightOut)
def get_highlight(highlight_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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


@app.put("/api/highlights/{highlight_id}", response_model=schemas.HighlightOut)
def update_highlight(highlight_id: str, payload: schemas.HighlightUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
    if payload.name is not None:  # 包括空字串，允許清除名稱
        # 空字串或只有空白字符表示清除名稱，設為 None
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


@app.delete("/api/highlights/{highlight_id}")
def delete_highlight(highlight_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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


@app.delete("/api/documents/{doc_id}/highlights")
def delete_all_highlights_for_document(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    deleted = db.query(models.Document).filter(models.Document.id == doc_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": True}


# Chat
@app.post("/api/chat", response_model=schemas.ChatResponse)
async def chat(payload: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    node = db.query(models.FlowNode).filter(models.FlowNode.id == payload.node_id, models.FlowNode.project_id == payload.project_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # 構建上下文提示
    context = payload.context
    evidence_ids = context.get("evidence_ids", [])
    evidence_info = context.get("evidence_info", {})  # 新增：標記片段的完整信息
    widget_states = context.get("widget_states", {})
    chat_history = context.get("chat_history", [])
    
    # 構建系統提示
    system_prompt = f"""你是論文寫作教練，正在指導學生完成「{node.label}」任務。
    
當前任務說明：{node.config.get('guidance', '請按照指示完成任務')}

你的角色：
1. 提供引導性問題，幫助學生思考
2. 檢核學生的填寫是否符合要求（如是否有證據支持）
3. 指出需要改進的地方，但不要直接代寫
4. 根據學生的進度給予適當的鼓勵或提醒

請用中文回覆，語氣友善且專業。"""
    
    # 構建用戶提示
    user_parts = [f"學生訊息：{payload.message}"]
    
    # 處理標記片段信息
    if evidence_info:
        evidence_details = []
        for evidence_id, info in evidence_info.items():
            # 構建 MinIO URL
            document_url = None
            if info.get("object_key"):
                try:
                    document_url = presign_get(info["object_key"])
                except Exception as e:
                    # 如果構建 URL 失敗，記錄錯誤但繼續處理
                    print(f"Warning: Failed to generate presigned URL for {info.get('object_key')}: {e}")
            
            # 格式化證據信息
            evidence_detail = f"""
標記片段 #{len(evidence_details) + 1}:
- 便條名稱: {info.get('name') or '（未命名）'}
- 證據內容: {info.get('snippet', '')}
- 頁碼: {info.get('page') or '（未指定）'}
- 文檔名稱: {info.get('document_title', '未知文檔')}
- 文檔URL: {document_url or '（無法獲取）'}"""
            evidence_details.append(evidence_detail)
        
        if evidence_details:
            user_parts.append(f"\n\n學生在訊息中引用了 {len(evidence_details)} 則標記片段，詳細資訊如下：")
            user_parts.extend(evidence_details)
    
    if evidence_ids and not evidence_info:
        # 如果只有 evidence_ids 但沒有 evidence_info（向後相容）
        user_parts.append(f"\n學生已選擇 {len(evidence_ids)} 則證據。")
    
    if widget_states:
        user_parts.append(f"\n當前任務進度：{json.dumps(widget_states, ensure_ascii=False, indent=2)}")
    
    if chat_history:
        recent_history = chat_history[-5:]  # 只取最近 5 條
        history_text = "\n".join([f"{'學生' if m.get('role') == 'user' else '教練'}: {m.get('content', '')}" for m in recent_history])
        user_parts.append(f"\n最近的對話歷史：\n{history_text}")
    
    user_prompt = "\n".join(user_parts)
    
    # 調用 Azure OpenAI
    azure = AzureOpenAIClient()
    response = await azure.chat(system_prompt, user_prompt)
    
    return schemas.ChatResponse(message=response, role="ai")


# Tasks
@app.post("/api/tasks", response_model=schemas.TaskResponse)
async def submit_task(payload: schemas.TaskRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.Project).filter(models.Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    version = db.query(models.TaskVersion).filter(
        models.TaskVersion.project_id == payload.project_id,
        models.TaskVersion.task_type == payload.task_type,
        models.TaskVersion.target_doc_id == payload.target_doc_id,
    ).count() + 1

    tv = models.TaskVersion(
        project_id=payload.project_id,
        user_id=current_user.id,
        target_doc_id=payload.target_doc_id,
        task_type=payload.task_type,
        version=version,
        content=payload.content,
        is_valid=True,
        validation_errors=[],
    )

    # Call Azure for feedback
    azure = AzureOpenAIClient()
    system_prompt = "你是論文寫作教練，檢核學生的填寫並提出改進建議。"
    user_prompt = f"Task {payload.task_type} content: {payload.content}"
    feedback = await azure.chat(system_prompt, user_prompt)
    tv.feedback = feedback

    db.add(tv)
    db.commit()
    db.refresh(tv)
    return schemas.TaskResponse(id=tv.id, feedback=tv.feedback, is_valid=tv.is_valid, validation_errors=tv.validation_errors)


# Upload presign
@app.post("/api/uploads/presign", response_model=schemas.PresignResponse)
def presign(payload: schemas.PresignRequest):
    url, object_key = presign_upload(payload.filename, payload.content_type)
    return schemas.PresignResponse(upload_url=url, object_key=object_key)


@app.get("/api/uploads/presign/get", response_model=schemas.PresignGetResponse)
def presign_get_url(object_key: str):
    url = presign_get(object_key)
    return schemas.PresignGetResponse(download_url=url)


# Cohorts
@app.get("/api/cohorts", response_model=list[schemas.CohortOut])
def list_cohorts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "teacher":
        cohorts = db.query(models.Cohort).filter(models.Cohort.teacher_id == current_user.id).all()
    else:
        cohort_ids = [m.cohort_id for m in current_user.memberships]
        cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
    result = []
    for c in cohorts:
        result.append(
            schemas.CohortOut(
                id=c.id,
                name=c.name,
                code=c.code,
                project_id=c.project_id,
                created_at=int(c.created_at.timestamp() * 1000),
                member_count=len(c.members),
            )
        )
    return result


def _generate_unique_cohort_code(db: Session) -> str:
    """產生唯一的 9 位數亂數群組編號。"""
    import random

    for _ in range(20):
        code = "".join(str(random.randint(0, 9)) for _ in range(9))
        exists = db.query(models.Cohort).filter(models.Cohort.code == code).first()
        if not exists:
            return code
    # 理論上幾乎不會發生，但避免無限迴圈
    raise HTTPException(status_code=500, detail="Failed to generate cohort code")


@app.post("/api/cohorts", response_model=schemas.CohortOut)
def create_cohort(payload: schemas.CohortCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create cohort")
    code = payload.code or _generate_unique_cohort_code(db)
    cohort = models.Cohort(name=payload.name, code=code, project_id=payload.project_id, teacher_id=current_user.id)
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return schemas.CohortOut(
        id=cohort.id,
        name=cohort.name,
        code=cohort.code,
        project_id=cohort.project_id,
        created_at=int(cohort.created_at.timestamp() * 1000),
        member_count=0,
    )


@app.get("/api/cohorts/{cohort_id}/members", response_model=list[schemas.CohortMemberOut])
def cohort_members(cohort_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role == "student":
        in_cohort = any(m.cohort_id == cohort_id for m in current_user.memberships)
        if not in_cohort:
            raise HTTPException(status_code=403, detail="Forbidden")
    members = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id).all()
    return [
        schemas.CohortMemberOut(
            user=schemas.UserOut.model_validate(m.user),
            status=m.status,
            progress=m.progress,
        )
        for m in members
    ]


@app.post("/api/cohorts/{cohort_id}/members")
def add_member(cohort_id: str, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can add")
    user_id = payload.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    exists = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id, models.CohortMember.user_id == user_id).first()
    if exists:
        return {"added": False, "message": "Already in cohort"}
    member = models.CohortMember(cohort_id=cohort_id, user_id=user_id, status="active", progress=0)
    db.add(member)
    db.commit()
    return {"added": True}


@app.post("/api/cohorts/{cohort_id}/join")
def join_cohort(cohort_id: str, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    code = payload.get("code")
    if cohort.code and cohort.code != code:
        raise HTTPException(status_code=403, detail="加入碼不正確")
    exists = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id, models.CohortMember.user_id == current_user.id).first()
    if exists:
        return {"joined": False, "message": "已在群組中"}
    member = models.CohortMember(cohort_id=cohort_id, user_id=current_user.id, status="active", progress=0)
    db.add(member)
    db.commit()
    return {"joined": True}


@app.post("/api/cohorts/join_by_code")
def join_cohort_by_code(payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student can join cohort")
    code = payload.get("code")
    if not code or len(str(code)) != 9:
        raise HTTPException(status_code=400, detail="群組編號必須為 9 位數")
    cohort = db.query(models.Cohort).filter(models.Cohort.code == str(code)).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="找不到對應的群組")
    exists = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort.id,
        models.CohortMember.user_id == current_user.id,
    ).first()
    if exists:
        return {"joined": False, "message": "已在群組中"}
    member = models.CohortMember(cohort_id=cohort.id, user_id=current_user.id, status="active", progress=0)
    db.add(member)
    db.commit()
    return {"joined": True, "cohort_id": cohort.id}


@app.patch("/api/cohorts/{cohort_id}/members/{user_id}")
def update_member(cohort_id: str, user_id: str, payload: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can update")
    member = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id, models.CohortMember.user_id == user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if "status" in payload:
        member.status = payload["status"]
    if "progress" in payload:
        member.progress = payload["progress"]
    db.commit()
    return {"updated": True}


@app.delete("/api/cohorts/{cohort_id}/members/{user_id}")
def remove_member(cohort_id: str, user_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can remove member")
    deleted = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id, models.CohortMember.user_id == user_id).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"deleted": True}


@app.patch("/api/cohorts/{cohort_id}", response_model=schemas.CohortOut)
def update_cohort(cohort_id: str, payload: schemas.CohortUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can update cohort")
    if payload.name is not None:
        cohort.name = payload.name
    if payload.code is not None:
        cohort.code = payload.code
    if payload.project_id is not None:
        cohort.project_id = payload.project_id
    db.commit()
    db.refresh(cohort)
    return schemas.CohortOut(
        id=cohort.id,
        name=cohort.name,
        code=cohort.code,
        project_id=cohort.project_id,
        created_at=int(cohort.created_at.timestamp() * 1000),
        member_count=len(cohort.members),
    )


@app.delete("/api/cohorts/{cohort_id}")
def delete_cohort(cohort_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can delete cohort")
    db.delete(cohort)
    db.commit()
    return {"deleted": True}


@app.get("/api/usage", response_model=list[schemas.UsageOut])
def list_usage(
    cohort_id: str | None = None,
    project_id: str | None = None,
    user_id: str | None = None,
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
                user=schemas.UserOut.model_validate(user),
                project_id=t.project_id,
                project_title=project.title if project else None,
                task_type=t.task_type,
                created_at=int(t.created_at.timestamp() * 1000),
                cohort_id=cohort_id,
                target_doc_id=t.target_doc_id,
            )
        )
    return results


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

