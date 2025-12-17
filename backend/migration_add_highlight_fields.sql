-- Migration script to add new fields to highlights table
-- Run this script to update the database schema

-- Add new columns to highlights table
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS x FLOAT,
ADD COLUMN IF NOT EXISTS y FLOAT,
ADD COLUMN IF NOT EXISTS width FLOAT,
ADD COLUMN IF NOT EXISTS height FLOAT,
ADD COLUMN IF NOT EXISTS evidence_type VARCHAR,
ADD COLUMN IF NOT EXISTS name VARCHAR;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'highlights'
ORDER BY ordinal_position;

