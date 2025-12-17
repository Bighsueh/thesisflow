#!/usr/bin/env python3
"""
Migration script to add new fields to highlights table.
Run this script to update the database schema.
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/env.local")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/thesisflow")

def migrate():
    """Add new columns to highlights table if they don't exist."""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if columns exist and add them if they don't
        migrations = [
            ("x", "FLOAT"),
            ("y", "FLOAT"),
            ("width", "FLOAT"),
            ("height", "FLOAT"),
            ("evidence_type", "VARCHAR"),
            ("name", "VARCHAR"),  # 標記片段名稱，使用者自訂
        ]
        
        for column_name, column_type in migrations:
            # Check if column exists
            check_query = text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'highlights' 
                AND column_name = :column_name
            """)
            result = conn.execute(check_query, {"column_name": column_name})
            
            if result.fetchone() is None:
                # Column doesn't exist, add it
                alter_query = text(f"ALTER TABLE highlights ADD COLUMN {column_name} {column_type}")
                conn.execute(alter_query)
                conn.commit()
                print(f"✓ Added column '{column_name}' to highlights table")
            else:
                print(f"✓ Column '{column_name}' already exists")
    
    print("\nMigration completed successfully!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

