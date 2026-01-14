"""
資料庫遷移腳本：將 flow_nodes/flow_edges 遷移至 task_config JSONB 欄位

執行步驟：
1. 備份資料庫
2. python db_migration.py
3. 檢查遷移結果
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import json
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/thesisflow")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


# 預設的摘要任務段落配置
DEFAULT_SECTIONS = [
    {
        "key": "a1_purpose",
        "label": "A1 研究目的 (Purpose)",
        "placeholder": "研究問題為何？",
        "minEvidence": 1,
    },
    {
        "key": "a2_method",
        "label": "A2 研究方法 (Method)",
        "placeholder": "如何進行研究？",
        "minEvidence": 1,
    },
    {
        "key": "a3_findings",
        "label": "A3 主要發現 (Findings)",
        "placeholder": "研究發現為何？",
        "minEvidence": 1,
    },
    {
        "key": "a4_limits",
        "label": "A4 研究限制 (Limitations)",
        "placeholder": "研究限制為何？",
        "minEvidence": 1,
    },
]

# 預設的比較維度
DEFAULT_DIMENSIONS = ["研究目的", "研究方法", "主要發現", "研究限制"]


def migrate_projects():
    """
    遍歷所有專案，將 flow_nodes 和 flow_edges 遷移至 task_config
    """
    db = Session()
    try:
        # 直接使用 SQL 查詢避免 ORM 關係問題
        result = db.execute(text("""
            SELECT p.id, p.title, p.semester, p.tags,
                   array_agg(fn.id || '|' || fn.type || '|' || fn.config::text) as nodes
            FROM projects p
            LEFT JOIN flow_nodes fn ON p.id = fn.project_id
            GROUP BY p.id, p.title, p.semester, p.tags
        """))

        projects_data = result.fetchall()
        migrated_count = 0
        error_count = 0

        for project_row in projects_data:
            project_id, title, semester, tags, nodes_str = project_row

            try:
                task_config = {
                    "summary": {
                        "enabled": False,
                        "sections": [],
                        "guidance": "",
                    },
                    "comparison": {
                        "enabled": False,
                        "dimensions": [],
                        "guidance": "",
                    },
                }

                # 解析 nodes
                if nodes_str and nodes_str[0] is not None:
                    for node_str in nodes_str:
                        if not node_str:
                            continue

                        parts = node_str.split("|")
                        if len(parts) >= 3:
                            node_id = parts[0]
                            node_type = parts[1]
                            try:
                                config = json.loads(parts[2])
                            except json.JSONDecodeError:
                                config = {}

                            # 提取摘要任務配置
                            if node_type == "task_summary":
                                task_config["summary"]["enabled"] = True
                                task_config["summary"]["sections"] = config.get("sections", DEFAULT_SECTIONS)
                                task_config["summary"]["guidance"] = config.get("guidance", "請撰寫摘要...")
                                if "minEvidence" in config:
                                    task_config["summary"]["minEvidence"] = config["minEvidence"]

                            # 提取比較任務配置
                            elif node_type == "task_comparison":
                                task_config["comparison"]["enabled"] = True
                                dims = config.get("dimensions", DEFAULT_DIMENSIONS)
                                # 如果 dimensions 是字串，分割它
                                if isinstance(dims, str):
                                    dims = [d.strip() for d in dims.split(",") if d.strip()]
                                task_config["comparison"]["dimensions"] = dims
                                task_config["comparison"]["guidance"] = config.get("guidance", "請比較兩篇文獻...")
                                if "minEvidence" in config:
                                    task_config["comparison"]["minEvidence"] = config["minEvidence"]

                # 如果沒有任何任務配置，使用預設值
                if not task_config["summary"]["enabled"] and not task_config["comparison"]["enabled"]:
                    task_config["summary"]["enabled"] = True
                    task_config["summary"]["sections"] = DEFAULT_SECTIONS
                    task_config["summary"]["guidance"] = "請仔細閱讀文獻後，針對以下四個面向撰寫摘要..."
                    task_config["comparison"]["enabled"] = True
                    task_config["comparison"]["dimensions"] = DEFAULT_DIMENSIONS
                    task_config["comparison"]["guidance"] = "請選擇兩篇文獻進行比較..."

                # 更新專案的 task_config
                db.execute(
                    text("""
                        UPDATE projects
                        SET task_config = :task_config
                        WHERE id = :project_id
                    """),
                    {
                        "task_config": json.dumps(task_config),
                        "project_id": project_id,
                    },
                )

                migrated_count += 1
                print(f"✓ 已遷移專案: {title} (ID: {project_id})")

            except Exception as e:
                error_count += 1
                print(f"✗ 遷移失敗: {project_id} - {str(e)}")

        db.commit()
        print(f"\n遷移完成！成功: {migrated_count}, 失敗: {error_count}")
        return migrated_count, error_count

    except Exception as e:
        db.rollback()
        print(f"遷移過程中發生錯誤: {str(e)}")
        raise
    finally:
        db.close()


def verify_migration():
    """
    驗證遷移結果
    """
    db = Session()
    try:
        result = db.execute(
            text("""
                SELECT id, title, task_config
                FROM projects
                WHERE task_config IS NOT NULL AND task_config != '{}'::jsonb
                LIMIT 5
            """)
        )

        print("\n驗證樣本（前 5 筆）:")
        for row in result:
            project_id, title, task_config = row
            print(f"\n專案: {title} (ID: {project_id})")
            print(f"配置: {json.dumps(json.loads(task_config) if isinstance(task_config, str) else task_config, ensure_ascii=False, indent=2)}")

    finally:
        db.close()


def auto_migrate_highlights_table():
    """
    應用啟動時自動遷移高亮表
    這是一個空實現，主要用於兼容性
    """
    try:
        db = Session()
        db.close()
    except Exception as e:
        print(f"自動遷移警告: {str(e)}")


if __name__ == "__main__":
    print("開始資料庫遷移...\n")
    migrated, errors = migrate_projects()

    if errors == 0:
        print("\n驗證遷移結果...")
        verify_migration()
        print("\n✓ 遷移成功！")
    else:
        print(f"\n⚠ 遷移完成，但有 {errors} 個錯誤。請檢查日誌。")
