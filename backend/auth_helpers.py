"""
權限驗證 Helper 函數

提供統一的專案存取權限檢查邏輯，支援新舊兩種架構：
- 新架構：透過 ProjectCohort 關聯表（多對多）
- 舊架構：透過 Project.cohort_id 和 Cohort.project_id（一對多，向後兼容）
"""

from sqlalchemy.orm import Session
import models


def get_user_accessible_project_ids(db: Session, user: models.User) -> set[str]:
    """
    獲取用戶可訪問的所有專案 ID（支援新舊架構）
    
    教師：可訪問所有專案
    學生：只能訪問所屬群組關聯的專案
    
    Args:
        db: 資料庫 session
        user: 當前用戶
        
    Returns:
        用戶可訪問的專案 ID 集合
    """
    if user.role == "teacher":
        # 教師可訪問所有專案
        return {p.id for p in db.query(models.Project).all()}
    
    # 學生：獲取所屬群組
    cohort_ids = [m.cohort_id for m in user.memberships]
    if not cohort_ids:
        return set()
    
    project_ids = set()
    
    # 新架構：透過 ProjectCohort 關聯表（多對多）
    try:
        links = db.query(models.ProjectCohort).filter(
            models.ProjectCohort.cohort_id.in_(cohort_ids)
        ).all()
        project_ids.update(link.project_id for link in links)
    except Exception:
        # ProjectCohort 表可能尚未創建（遷移前）
        pass
    
    # 舊架構向後兼容：Project.cohort_id（一對多）
    old_projects = db.query(models.Project).filter(
        models.Project.cohort_id.in_(cohort_ids)
    ).all()
    project_ids.update(p.id for p in old_projects)
    
    # 舊架構向後兼容：Cohort.project_id（反向關聯）
    cohorts = db.query(models.Cohort).filter(
        models.Cohort.id.in_(cohort_ids)
    ).all()
    project_ids.update(c.project_id for c in cohorts if c.project_id)
    
    return project_ids


def check_project_access(db: Session, user: models.User, project_id: str) -> bool:
    """
    檢查用戶是否有權訪問指定專案
    
    Args:
        db: 資料庫 session
        user: 當前用戶
        project_id: 要檢查的專案 ID
        
    Returns:
        True 如果用戶有權訪問，否則 False
    """
    if user.role == "teacher":
        return True
    return project_id in get_user_accessible_project_ids(db, user)


def get_cohort_project_ids(db: Session, cohort_id: str) -> list[str]:
    """
    獲取群組相關的所有專案 ID（支援新舊兩種架構）
    
    此函數主要用於分析和統計功能
    
    Args:
        db: 資料庫 session
        cohort_id: 群組 ID
        
    Returns:
        群組關聯的專案 ID 列表
    """
    project_ids = set()
    
    # 新架構：透過 ProjectCohort 關聯表
    try:
        links = db.query(models.ProjectCohort).filter(
            models.ProjectCohort.cohort_id == cohort_id
        ).all()
        project_ids.update(link.project_id for link in links)
    except Exception:
        pass
    
    # 舊架構：Project.cohort_id
    new_projects = db.query(models.Project.id).filter(
        models.Project.cohort_id == cohort_id
    ).all()
    project_ids.update(p.id for p in new_projects)
    
    # 舊架構：Cohort.project_id
    cohort = db.query(models.Cohort).filter(
        models.Cohort.id == cohort_id
    ).first()
    if cohort and cohort.project_id:
        project_ids.add(cohort.project_id)
    
    return list(project_ids)
