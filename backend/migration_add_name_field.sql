-- Migration script to add name field to highlights table
-- Run this script to update the database schema
-- Usage: psql -d thesisflow -f backend/migration_add_name_field.sql

-- Add name column to highlights table if it doesn't exist
ALTER TABLE highlights 
ADD COLUMN IF NOT EXISTS name VARCHAR;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'highlights'
ORDER BY ordinal_position;







