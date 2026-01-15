-- Migration: Add many-to-many relationship for Project-Cohort and user_id to Document/Highlight
-- Date: 2026-01-15
-- Description: 
--   1. Create project_cohorts junction table for many-to-many relationship
--   2. Migrate existing data from Project.cohort_id and Cohort.project_id
--   3. Add user_id to documents table
--   4. Add user_id to highlights table

-- 1. Create project_cohorts junction table
CREATE TABLE IF NOT EXISTS project_cohorts (
    id VARCHAR PRIMARY KEY,
    project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    cohort_id VARCHAR NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, cohort_id)
);

-- 2. Migrate existing data from Project.cohort_id to project_cohorts
INSERT INTO project_cohorts (id, project_id, cohort_id)
SELECT gen_random_uuid()::text, id, cohort_id 
FROM projects 
WHERE cohort_id IS NOT NULL
ON CONFLICT (project_id, cohort_id) DO NOTHING;

-- 3. Migrate existing data from Cohort.project_id to project_cohorts
INSERT INTO project_cohorts (id, project_id, cohort_id)
SELECT gen_random_uuid()::text, project_id, id 
FROM cohorts 
WHERE project_id IS NOT NULL
ON CONFLICT (project_id, cohort_id) DO NOTHING;

-- 4. Add user_id column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;

-- 5. Add user_id column to highlights table
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_cohorts_project_id ON project_cohorts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_cohorts_cohort_id ON project_cohorts(cohort_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);
