-- Migration: Fix missing columns for analytics
-- Date: 2026-01-15
-- Description: 
--   修復 analytics 端點所需的缺失欄位
--   - 檢查並添加 documents.learning_task_id（如果還是 project_id）
--   - 添加 documents.user_id
--   - 添加 highlights.user_id
--   - 創建 learning_task_cohorts 表（如果不存在）

-- 1. 處理 documents 表
-- 如果存在 project_id 但不存在 learning_task_id，則重命名欄位
DO $$
BEGIN
    -- 檢查 documents 表是否有 project_id 欄位但沒有 learning_task_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'project_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'learning_task_id'
    ) THEN
        -- 先刪除舊的外鍵約束
        ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
        -- 重命名欄位
        ALTER TABLE documents RENAME COLUMN project_id TO learning_task_id;
        RAISE NOTICE 'Renamed documents.project_id to learning_task_id';
    END IF;
    
    -- 如果兩個欄位都不存在，創建 learning_task_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'learning_task_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN learning_task_id VARCHAR;
        RAISE NOTICE 'Added documents.learning_task_id column';
    END IF;
END $$;

-- 2. 添加外鍵約束（如果 learning_tasks 表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_tasks') THEN
        -- 先嘗試刪除舊約束
        ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_learning_task_id_fkey;
        -- 添加新的外鍵約束
        ALTER TABLE documents ADD CONSTRAINT documents_learning_task_id_fkey 
            FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for documents.learning_task_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        -- 如果還是使用 projects 表
        ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_learning_task_id_fkey;
        ALTER TABLE documents ADD CONSTRAINT documents_learning_task_id_fkey 
            FOREIGN KEY (learning_task_id) REFERENCES projects(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint for documents.learning_task_id (referencing projects)';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- 3. 添加 documents.user_id 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added documents.user_id column';
    ELSE
        RAISE NOTICE 'documents.user_id already exists';
    END IF;
END $$;

-- 4. 添加 highlights.user_id 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'highlights' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE highlights ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added highlights.user_id column';
    ELSE
        RAISE NOTICE 'highlights.user_id already exists';
    END IF;
END $$;

-- 5. 創建 learning_task_cohorts 表（如果不存在）
CREATE TABLE IF NOT EXISTS learning_task_cohorts (
    id VARCHAR PRIMARY KEY,
    learning_task_id VARCHAR NOT NULL,
    cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(learning_task_id, cohort_id)
);

-- 6. 創建索引
CREATE INDEX IF NOT EXISTS idx_documents_learning_task_id ON documents(learning_task_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_learning_task_id ON learning_task_cohorts(learning_task_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_cohort_id ON learning_task_cohorts(cohort_id);

-- 7. 驗證結果
DO $$
DECLARE
    doc_lt_id BOOLEAN;
    doc_user_id BOOLEAN;
    hl_user_id BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'learning_task_id') INTO doc_lt_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id') INTO doc_user_id;
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'highlights' AND column_name = 'user_id') INTO hl_user_id;
    
    RAISE NOTICE '=== Migration Results ===';
    RAISE NOTICE 'documents.learning_task_id exists: %', doc_lt_id;
    RAISE NOTICE 'documents.user_id exists: %', doc_user_id;
    RAISE NOTICE 'highlights.user_id exists: %', hl_user_id;
END $$;
