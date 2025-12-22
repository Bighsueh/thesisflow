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
