import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv
import os
from db import Base, engine
from db_migration import auto_migrate_highlights_table
from middleware.cors import setup_cors
from middleware.exception_handler import setup_exception_handler
from routes import auth, students, projects, documents, highlights, cohorts, chat, tasks, uploads, workflow, usage

# 載入環境變數
_env_paths = [
    ".env",
    "backend/.env",
    os.path.join(os.path.dirname(__file__), ".env"),
    "env.local",
    "backend/env.local",
    os.path.join(os.path.dirname(__file__), "env.local"),
]
for _env_path in _env_paths:
    if os.path.exists(_env_path):
        load_dotenv(_env_path)
        break

# 執行資料庫遷移
auto_migrate_highlights_table()

# Fix missing columns
from sqlalchemy import text
from db import SessionLocal
try:
    db = SessionLocal()
    # Check if task_config column exists in projects table
    result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='task_config'"))
    if not result.fetchone():
        print("Adding missing task_config column to projects table...")
        db.execute(text("ALTER TABLE projects ADD COLUMN task_config JSONB DEFAULT '{}'"))
        db.commit()
    # Check if cohort_id column exists in projects table
    result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='cohort_id'"))
    if not result.fetchone():
        print("Adding missing cohort_id column to projects table...")
        db.execute(text("ALTER TABLE projects ADD COLUMN cohort_id VARCHAR REFERENCES cohorts(id) ON DELETE CASCADE"))
        db.commit()
    db.close()
except Exception as e:
    print(f"Migration error: {e}")

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ThesisFlow API")

# 設定中間件
setup_cors(app)
setup_exception_handler(app)

# 註冊路由
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(projects.router)
app.include_router(documents.router)
app.include_router(highlights.router)
app.include_router(cohorts.router)
app.include_router(chat.router)
app.include_router(tasks.router)
app.include_router(uploads.router)
app.include_router(workflow.router)
app.include_router(usage.router)

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
