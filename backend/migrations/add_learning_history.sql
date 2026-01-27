-- 建立學習歷程表
-- 記錄學生的閱讀互動記錄（標記、筆記、AI 解釋等）

CREATE TABLE IF NOT EXISTS learning_history (
    id VARCHAR PRIMARY KEY,
    user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR REFERENCES projects(id) ON DELETE CASCADE,
    document_id VARCHAR REFERENCES documents(id) ON DELETE CASCADE,
    highlight_id VARCHAR REFERENCES highlights(id) ON DELETE SET NULL,
    event_type VARCHAR NOT NULL,  -- 'confused' | 'important' | 'question' | 'reference' | 'bookmark' | 'ai_explain'
    content TEXT,                  -- 使用者筆記或標記的文字
    ai_response TEXT,              -- AI 的回應
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_learning_history_user_id ON learning_history(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_project_id ON learning_history(project_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_document_id ON learning_history(document_id);
CREATE INDEX IF NOT EXISTS idx_learning_history_created_at ON learning_history(created_at DESC);
