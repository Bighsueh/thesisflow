"""
權限驗證 Helper 函數

提供統一的學習任務存取權限檢查邏輯，支援新舊兩種架構：
- 新架構：透過 LearningTaskCohort 關聯表（多對多）
- 舊架構：透過 LearningTask.cohort_id 和 Cohort.learning_task_id（一對多，向後兼容）
"""

from sqlalchemy.orm import Session
import models


def get_user_accessible_learning_task_ids(db: Session, user: models.User) -> set[str]:
    """
    獲取用戶可訪問的所有學習任務 ID（支援新舊架構）
    
    教師：可訪問所有學習任務
    學生：只能訪問所屬群組關聯的學習任務
    
    Args:
        db: 資料庫 session
        user: 當前用戶
        
    Returns:
        用戶可訪問的學習任務 ID 集合
    """
    if user.role == "teacher":
        # 教師可訪問所有學習任務
        return {lt.id for lt in db.query(models.LearningTask).all()}
    
    # 學生：獲取所屬群組
    cohort_ids = [m.cohort_id for m in user.memberships]
    if not cohort_ids:
        return set()
    
    learning_task_ids = set()
    
    # 新架構：透過 LearningTaskCohort 關聯表（多對多）
    try:
        links = db.query(models.LearningTaskCohort).filter(
            models.LearningTaskCohort.cohort_id.in_(cohort_ids)
        ).all()
        learning_task_ids.update(link.learning_task_id for link in links)
    except Exception:
        # LearningTaskCohort 表可能尚未創建（遷移前）
        pass
    
    # 舊架構向後兼容：LearningTask.cohort_id（一對多）
    old_learning_tasks = db.query(models.LearningTask).filter(
        models.LearningTask.cohort_id.in_(cohort_ids)
    ).all()
    learning_task_ids.update(lt.id for lt in old_learning_tasks)
    
    # 舊架構向後兼容：Cohort.learning_task_id（反向關聯）
    cohorts = db.query(models.Cohort).filter(
        models.Cohort.id.in_(cohort_ids)
    ).all()
    learning_task_ids.update(c.learning_task_id for c in cohorts if c.learning_task_id)
    
    return learning_task_ids


def check_learning_task_access(db: Session, user: models.User, learning_task_id: str) -> bool:
    """
    檢查用戶是否有權訪問指定學習任務
    
    Args:
        db: 資料庫 session
        user: 當前用戶
        learning_task_id: 要檢查的學習任務 ID
        
    Returns:
        True 如果用戶有權訪問，否則 False
    """
    if user.role == "teacher":
        return True
    return learning_task_id in get_user_accessible_learning_task_ids(db, user)


def get_cohort_learning_task_ids(db: Session, cohort_id: str) -> list[str]:
    """
    獲取群組相關的所有學習任務 ID（支援新舊兩種架構）
    
    此函數主要用於分析和統計功能
    
    Args:
        db: 資料庫 session
        cohort_id: 群組 ID
        
    Returns:
        群組關聯的學習任務 ID 列表
    """
    learning_task_ids = set()
    
    # 新架構：透過 LearningTaskCohort 關聯表
    try:
        links = db.query(models.LearningTaskCohort).filter(
            models.LearningTaskCohort.cohort_id == cohort_id
        ).all()
        learning_task_ids.update(link.learning_task_id for link in links)
    except Exception:
        pass
    
    # 舊架構：LearningTask.cohort_id
    new_learning_tasks = db.query(models.LearningTask.id).filter(
        models.LearningTask.cohort_id == cohort_id
    ).all()
    learning_task_ids.update(lt.id for lt in new_learning_tasks)
    
    # 舊架構：Cohort.learning_task_id
    cohort = db.query(models.Cohort).filter(
        models.Cohort.id == cohort_id
    ).first()
    if cohort and cohort.learning_task_id:
        learning_task_ids.add(cohort.learning_task_id)
    
    return list(learning_task_ids)
