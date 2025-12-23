from sqlalchemy import inspect, text
from db import engine

def auto_migrate_highlights_table():
    """
    自動遷移 highlights 表格，添加缺少的欄位。
    這個函數會檢查現有的 highlights 表格，如果缺少某些欄位則自動添加。
    """
    try:
        with engine.begin() as conn:
            inspector = inspect(engine)
            
            # 檢查 highlights 表格是否存在
            if 'highlights' not in inspector.get_table_names():
                # 如果表格不存在，Base.metadata.create_all 會自動創建，這裡不需要做任何事
                return
            
            # 檢查並添加所有需要的欄位
            columns_to_add = [
                ("name", "VARCHAR"),
                ("x", "FLOAT"),
                ("y", "FLOAT"),
                ("width", "FLOAT"),
                ("height", "FLOAT"),
                ("evidence_type", "VARCHAR"),
            ]
            
            for column_name, column_type in columns_to_add:
                check_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'highlights' 
                    AND column_name = :column_name
                """)
                result = conn.execute(check_query, {"column_name": column_name})
                row = result.fetchone()
                
                if row is None:
                    alter_query = text(f"ALTER TABLE highlights ADD COLUMN {column_name} {column_type}")
                    conn.execute(alter_query)
                    print(f"✓ Auto-migrated: Added '{column_name}' column to highlights table")
            
            print("✓ Highlights table migration check completed")
    except Exception as e:
        print(f"Warning: Auto-migration failed: {e}")
        import traceback
        traceback.print_exc()
