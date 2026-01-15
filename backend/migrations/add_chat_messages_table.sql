-- 新增 chat_messages 資料表
-- 用於儲存學生與 AI 教練的對話記錄

CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL,
    user_id VARCHAR NOT NULL,
    role VARCHAR NOT NULL,  -- user | coach | status
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'UTC'),
    
    CONSTRAINT fk_chat_messages_project
        FOREIGN KEY (project_id) 
        REFERENCES projects(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_chat_messages_user
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- 建立索引以提升查詢效能
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

-- 複合索引用於常見查詢模式
CREATE INDEX idx_chat_messages_project_user ON chat_messages(project_id, user_id);
CREATE INDEX idx_chat_messages_project_created ON chat_messages(project_id, created_at DESC);

-- 註解說明
COMMENT ON TABLE chat_messages IS '學生與 AI 教練的對話記錄';
COMMENT ON COLUMN chat_messages.id IS '訊息唯一識別碼';
COMMENT ON COLUMN chat_messages.project_id IS '所屬專案ID';
COMMENT ON COLUMN chat_messages.user_id IS '發送訊息的用戶ID';
COMMENT ON COLUMN chat_messages.role IS '訊息角色：user(學生) | coach(AI教練) | status(系統)';
COMMENT ON COLUMN chat_messages.content IS '訊息內容';
COMMENT ON COLUMN chat_messages.context IS '上下文資訊（JSON格式），包含 evidence_ids, current_doc_id 等';
COMMENT ON COLUMN chat_messages.created_at IS '訊息建立時間';
