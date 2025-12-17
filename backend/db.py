import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

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

# Docker 環境會透過環境變數設定 DATABASE_URL
# 如果沒有設定，則使用預設值（本地開發環境）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/thesisflow")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

