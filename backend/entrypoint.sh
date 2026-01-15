#!/bin/bash
set -e

echo "=== ThesisFlow Backend Startup ==="

# 等待 PostgreSQL 可用
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is up!"

# 執行資料庫遷移/初始化
echo "Running database migrations..."

# 從 DATABASE_URL 解析連線資訊
if [ -n "$DATABASE_URL" ]; then
  # 解析 DATABASE_URL (格式: postgresql://user:password@host:port/dbname)
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:\/]*\).*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  export PGPASSWORD="$DB_PASSWORD"
fi

# 執行必要的資料庫遷移
psql -h "${DB_HOST:-postgres}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-thesisflow}" << 'EOSQL'
-- 確保必要的欄位存在

-- 1. documents.learning_task_id
ALTER TABLE documents ADD COLUMN IF NOT EXISTS learning_task_id VARCHAR;

-- 2. 從 project_id 複製資料（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'project_id') THEN
    UPDATE documents SET learning_task_id = project_id WHERE learning_task_id IS NULL AND project_id IS NOT NULL;
  END IF;
END $$;

-- 3. documents.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id') THEN
    ALTER TABLE documents ADD COLUMN user_id VARCHAR;
  END IF;
END $$;

-- 4. highlights.user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'highlights' AND column_name = 'user_id') THEN
    ALTER TABLE highlights ADD COLUMN user_id VARCHAR;
  END IF;
END $$;

-- 5. 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_documents_learning_task_id ON documents(learning_task_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);

-- 6. 創建 learning_task_cohorts 表（如果不存在）
CREATE TABLE IF NOT EXISTS learning_task_cohorts (
    id VARCHAR PRIMARY KEY,
    learning_task_id VARCHAR NOT NULL,
    cohort_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(learning_task_id, cohort_id)
);
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_learning_task_id ON learning_task_cohorts(learning_task_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_cohort_id ON learning_task_cohorts(cohort_id);

EOSQL

echo "Database migrations completed!"

# 啟動 FastAPI 應用
echo "Starting FastAPI application..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000
