#!/usr/bin/env python3
"""
執行資料庫遷移腳本

用法：
    python migrations/run_migration.py migrations/add_chat_messages_table.sql
"""

import sys
import os
from pathlib import Path

# 將 backend 目錄加入 Python 路徑
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from db import DATABASE_URL

def run_migration(sql_file_path: str):
    """執行 SQL 遷移腳本"""
    # 讀取 SQL 文件
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 建立資料庫連線
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # 開始交易
            with connection.begin():
                # 執行 SQL（分割多個語句）
                statements = [s.strip() for s in sql_content.split(';') if s.strip()]
                for statement in statements:
                    if statement:
                        print(f"執行: {statement[:80]}...")
                        connection.execute(text(statement))
                
                print(f"\n✓ 遷移成功完成: {sql_file_path}")
        
    except Exception as e:
        print(f"\n✗ 遷移失敗: {e}")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python run_migration.py <sql_file_path>")
        print("範例: python migrations/run_migration.py migrations/add_chat_messages_table.sql")
        sys.exit(1)
    
    sql_file = sys.argv[1]
    
    if not os.path.exists(sql_file):
        print(f"錯誤: 找不到檔案 {sql_file}")
        sys.exit(1)
    
    print(f"準備執行遷移: {sql_file}")
    print("=" * 60)
    
    run_migration(sql_file)
