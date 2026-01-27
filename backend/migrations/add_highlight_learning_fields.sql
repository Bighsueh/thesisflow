-- 新增 Highlight 學習型標記欄位
-- 這些欄位支援新的學習型標記系統：不懂/重點/與AI討論/看Ref/書籤

-- 新增 mark_type 欄位（學習型標記類型）
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS mark_type VARCHAR;

-- 新增 note 欄位（使用者筆記）
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS note TEXT;

-- 新增 ai_explanation 欄位（AI 解釋）
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS ai_explanation TEXT;

-- 新增 is_resolved 欄位（是否已理解）
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
