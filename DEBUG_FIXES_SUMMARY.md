# Debug 修復總結

## 執行日期
2026-01-15

## 問題 1：SQLAlchemy AmbiguousForeignKeysError

### 症狀
後端啟動時即崩潰，任何 API 請求都回傳 500 錯誤。

### 根本原因
Project 和 Cohort 之間存在**雙向外鍵關係**：
- `Project.cohort_id` → `Cohort.id`
- `Cohort.project_id` → `Project.id`

SQLAlchemy 無法自動判斷 `Project.cohort` 和 `Cohort.projects` 這兩個 relationship 應該使用哪個外鍵。

### 修復方式
在 `backend/models.py` 中明確指定 `foreign_keys` 參數：

```python
# Project 類別
cohort = relationship(
    "Cohort",
    back_populates="projects",
    foreign_keys=[cohort_id],  # 明確指定使用 Project.cohort_id
)

# Cohort 類別
projects = relationship(
    "Project",
    back_populates="cohort",
    foreign_keys="Project.cohort_id",  # 明確指定使用 Project.cohort_id
)
```

### 執行期證據
- **debug.log line 13-15**：確認雙向 FK 存在
- **修復後**：後端正常啟動，無 AmbiguousForeignKeysError

---

## 問題 2：Database Schema 缺少欄位

### 症狀
前端 `/teacher` 頁面顯示 "Failed to fetch"，瀏覽器 console 顯示 CORS 錯誤。

### 根本原因
資料庫 `projects` 表缺少兩個新欄位：
1. `task_config` (JSONB)
2. `cohort_id` (VARCHAR)

當後端嘗試查詢這些欄位時，PostgreSQL 回傳：
```
psycopg2.errors.UndefinedColumn: column projects.task_config does not exist
```

這導致後端回傳 500，瀏覽器因為沒有正確的 CORS header 而顯示 CORS 錯誤。

### 修復方式
在 `backend/main.py` 啟動時自動檢查並新增缺少的欄位：

```python
from sqlalchemy import text
from db import SessionLocal

try:
    db = SessionLocal()
    # Check and add task_config column
    result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='task_config'"))
    if not result.fetchone():
        print("Adding missing task_config column to projects table...")
        db.execute(text("ALTER TABLE projects ADD COLUMN task_config JSONB DEFAULT '{}'"))
        db.commit()
    
    # Check and add cohort_id column
    result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='cohort_id'"))
    if not result.fetchone():
        print("Adding missing cohort_id column to projects table...")
        db.execute(text("ALTER TABLE projects ADD COLUMN cohort_id VARCHAR REFERENCES cohorts(id) ON DELETE CASCADE"))
        db.commit()
    
    db.close()
except Exception as e:
    print(f"Migration error: {e}")
```

### 執行期證據
- **debug.log line 126, 132, 139, 145**：H8 exception 顯示 `column projects.task_config does not exist`
- **terminal line 35, 38, 52, 57**：修復後 `/api/projects` 回傳 200 OK

---

## 總結

兩個問題都已修復：
1. ✅ SQLAlchemy relationship ambiguity → 明確指定 foreign_keys
2. ✅ 資料庫缺少欄位 → 自動 migration 在啟動時執行

系統現在可以正常運作。
