-- Migration: Rename projects table to learning_tasks
-- Date: 2026-01-15
-- Description: 
--   將 projects 表重命名為 learning_tasks
--   更新所有相關的外鍵約束和欄位名稱

-- 1. 重命名主表
ALTER TABLE projects RENAME TO learning_tasks;

-- 2. 重命名序列（如果存在）
ALTER SEQUENCE IF EXISTS projects_id_seq RENAME TO learning_tasks_id_seq;

-- 3. 重命名索引
ALTER INDEX IF EXISTS projects_pkey RENAME TO learning_tasks_pkey;

-- 4. 更新 flow_nodes 表的外鍵
ALTER TABLE flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_project_id_fkey;
ALTER TABLE flow_nodes RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE flow_nodes ADD CONSTRAINT flow_nodes_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;

-- 5. 更新 flow_edges 表的外鍵
ALTER TABLE flow_edges DROP CONSTRAINT IF EXISTS flow_edges_project_id_fkey;
ALTER TABLE flow_edges RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE flow_edges ADD CONSTRAINT flow_edges_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;

-- 6. 更新 documents 表的外鍵
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE documents RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE documents ADD CONSTRAINT documents_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;

-- 7. 更新 task_versions 表的外鍵
ALTER TABLE task_versions DROP CONSTRAINT IF EXISTS task_versions_project_id_fkey;
ALTER TABLE task_versions RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE task_versions ADD CONSTRAINT task_versions_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;

-- 8. 更新 cohorts 表的外鍵（舊架構向後兼容）
ALTER TABLE cohorts DROP CONSTRAINT IF EXISTS cohorts_project_id_fkey;
ALTER TABLE cohorts RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE cohorts ADD CONSTRAINT cohorts_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE SET NULL;

-- 9. 更新 project_cohorts 表
ALTER TABLE project_cohorts DROP CONSTRAINT IF EXISTS project_cohorts_project_id_fkey;
ALTER TABLE project_cohorts RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE project_cohorts RENAME TO learning_task_cohorts;
ALTER TABLE learning_task_cohorts ADD CONSTRAINT learning_task_cohorts_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;
ALTER TABLE learning_task_cohorts DROP CONSTRAINT IF EXISTS uq_project_cohort;
ALTER TABLE learning_task_cohorts ADD CONSTRAINT uq_learning_task_cohort UNIQUE (learning_task_id, cohort_id);

-- 10. 更新 workflow_states 表的外鍵
ALTER TABLE workflow_states DROP CONSTRAINT IF EXISTS workflow_states_project_id_fkey;
ALTER TABLE workflow_states RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE workflow_states ADD CONSTRAINT workflow_states_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;
ALTER TABLE workflow_states DROP CONSTRAINT IF EXISTS uq_workflow_state;
ALTER TABLE workflow_states ADD CONSTRAINT uq_workflow_state UNIQUE (learning_task_id, user_id);

-- 11. 更新 task_states 表的外鍵
ALTER TABLE task_states DROP CONSTRAINT IF EXISTS task_states_project_id_fkey;
ALTER TABLE task_states RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE task_states ADD CONSTRAINT task_states_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;
ALTER TABLE task_states DROP CONSTRAINT IF EXISTS uq_task_state;
ALTER TABLE task_states ADD CONSTRAINT uq_task_state UNIQUE (learning_task_id, user_id);

-- 12. 更新 chat_messages 表的外鍵
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_project_id_fkey;
ALTER TABLE chat_messages RENAME COLUMN project_id TO learning_task_id;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_learning_task_id_fkey 
  FOREIGN KEY (learning_task_id) REFERENCES learning_tasks(id) ON DELETE CASCADE;

-- 13. 重建相關索引
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_learning_task_id ON learning_task_cohorts(learning_task_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_cohorts_cohort_id ON learning_task_cohorts(cohort_id);
DROP INDEX IF EXISTS idx_project_cohorts_project_id;
DROP INDEX IF EXISTS idx_project_cohorts_cohort_id;
