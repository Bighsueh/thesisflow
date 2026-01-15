# 資料庫遷移指南

## 概述

此目錄包含資料庫遷移腳本，用於更新資料庫架構。

## 新增 chat_messages 資料表

此遷移添加了 `chat_messages` 資料表，用於儲存學生與 AI 教練的對話記錄。

### 執行遷移

#### 方法 1：使用 Python 腳本（推薦）

```bash
cd backend
python migrations/run_migration.py migrations/add_chat_messages_table.sql
```

#### 方法 2：直接使用 psql

```bash
psql -h localhost -U your_username -d your_database -f backend/migrations/add_chat_messages_table.sql
```

請將 `your_username` 和 `your_database` 替換為實際的資料庫連線資訊。

#### 方法 3：使用 pgAdmin 或其他 GUI 工具

1. 開啟 `add_chat_messages_table.sql` 檔案
2. 複製 SQL 內容
3. 在 pgAdmin 的查詢工具中貼上並執行

### 驗證遷移

執行遷移後，可以使用以下 SQL 查詢來驗證資料表是否成功建立：

```sql
-- 檢查資料表是否存在
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'chat_messages'
);

-- 查看資料表結構
\d chat_messages

-- 或使用 SQL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;
```

### 遷移內容

此遷移會：

1. 建立 `chat_messages` 資料表，包含以下欄位：
   - `id`: 訊息唯一識別碼（主鍵）
   - `project_id`: 所屬專案ID（外鍵）
   - `user_id`: 發送訊息的用戶ID（外鍵）
   - `role`: 訊息角色（user/coach/status）
   - `content`: 訊息內容
   - `context`: 上下文資訊（JSONB）
   - `created_at`: 建立時間

2. 建立索引以提升查詢效能：
   - `idx_chat_messages_project_id`
   - `idx_chat_messages_user_id`
   - `idx_chat_messages_created_at`
   - `idx_chat_messages_role`
   - `idx_chat_messages_project_user`（複合索引）
   - `idx_chat_messages_project_created`（複合索引）

3. 設定外鍵約束，確保資料完整性

### 回滾

如果需要回滾此遷移，可以執行：

```sql
DROP TABLE IF EXISTS chat_messages CASCADE;
```

**注意**：回滾操作會永久刪除所有對話記錄資料，請謹慎操作！

## 故障排除

### 常見問題

1. **權限錯誤**
   ```
   ERROR: permission denied for table projects
   ```
   解決方法：確保執行遷移的資料庫用戶有足夠的權限。

2. **外鍵約束錯誤**
   ```
   ERROR: relation "projects" does not exist
   ```
   解決方法：確保 `projects` 和 `users` 資料表已經存在。

3. **連線錯誤**
   ```
   ERROR: could not connect to server
   ```
   解決方法：檢查資料庫連線設定（`backend/.env` 或環境變數）。

### 檢查資料庫連線

```bash
cd backend
python -c "from db import DATABASE_URL; print(DATABASE_URL)"
```

## 注意事項

- 執行遷移前，建議先備份資料庫
- 在生產環境執行前，應先在測試環境驗證
- 確保應用程式已停止或處於維護模式，避免資料不一致
