from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user
import random

router = APIRouter(prefix="/api/cohorts", tags=["cohorts"])

# Helper function for Pydantic v1/v2 compatibility
def to_pydantic(model_class, obj):
    """Convert SQLAlchemy model to Pydantic model, compatible with both v1 and v2."""
    try:
        # Pydantic v2
        return model_class.model_validate(obj)
    except AttributeError:
        # Pydantic v1
        return model_class.from_orm(obj)

def _generate_unique_cohort_code(db: Session) -> str:
    """產生唯一的 9 位數亂數群組編號。"""
    for _ in range(20):
        code = "".join(str(random.randint(0, 9)) for _ in range(9))
        exists = db.query(models.Cohort).filter(models.Cohort.code == code).first()
        if not exists:
            return code
    # 理論上幾乎不會發生，但避免無限迴圈
    raise HTTPException(status_code=500, detail="Failed to generate cohort code")

@router.get("", response_model=list[schemas.CohortOut])
def list_cohorts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "teacher":
        cohorts = db.query(models.Cohort).filter(models.Cohort.teacher_id == current_user.id).all()
    else:
        cohort_ids = [m.cohort_id for m in current_user.memberships]
        cohorts = db.query(models.Cohort).filter(models.Cohort.id.in_(cohort_ids)).all()
    result = []
    for c in cohorts:
        result.append(
            schemas.CohortOut(
                id=c.id,
                name=c.name,
                code=c.code,
                project_id=c.project_id,
                created_at=int(c.created_at.timestamp() * 1000),
                member_count=len(c.members),
            )
        )
    return result

@router.post("", response_model=schemas.CohortOut)
def create_cohort(
    payload: schemas.CohortCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create cohort")
    code = payload.code or _generate_unique_cohort_code(db)
    cohort = models.Cohort(
        name=payload.name,
        code=code,
        project_id=payload.project_id,
        teacher_id=current_user.id
    )
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return schemas.CohortOut(
        id=cohort.id,
        name=cohort.name,
        code=cohort.code,
        project_id=cohort.project_id,
        created_at=int(cohort.created_at.timestamp() * 1000),
        member_count=0,
    )

@router.get("/{cohort_id}", response_model=schemas.CohortOut)
def get_cohort(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    
    # 驗證權限
    if current_user.role == "student":
        in_cohort = any(m.cohort_id == cohort_id for m in current_user.memberships)
        if not in_cohort:
            raise HTTPException(status_code=403, detail="Forbidden")
    elif current_user.role == "teacher" and cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    return schemas.CohortOut(
        id=cohort.id,
        name=cohort.name,
        code=cohort.code,
        project_id=cohort.project_id,
        created_at=int(cohort.created_at.timestamp() * 1000),
        member_count=len(cohort.members),
    )

@router.put("/{cohort_id}", response_model=schemas.CohortOut)
def update_cohort(
    cohort_id: str,
    payload: schemas.CohortUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can update cohort")
    if payload.name is not None:
        cohort.name = payload.name
    if payload.code is not None:
        cohort.code = payload.code
    if payload.project_id is not None:
        cohort.project_id = payload.project_id
    db.commit()
    db.refresh(cohort)
    return schemas.CohortOut(
        id=cohort.id,
        name=cohort.name,
        code=cohort.code,
        project_id=cohort.project_id,
        created_at=int(cohort.created_at.timestamp() * 1000),
        member_count=len(cohort.members),
    )

@router.delete("/{cohort_id}")
def delete_cohort(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can delete cohort")
    db.delete(cohort)
    db.commit()
    return {"deleted": True}

@router.get("/{cohort_id}/members", response_model=list[schemas.CohortMemberOut])
def cohort_members(
    cohort_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role == "student":
        in_cohort = any(m.cohort_id == cohort_id for m in current_user.memberships)
        if not in_cohort:
            raise HTTPException(status_code=403, detail="Forbidden")
    members = db.query(models.CohortMember).filter(models.CohortMember.cohort_id == cohort_id).all()
    return [
        schemas.CohortMemberOut(
            user=to_pydantic(schemas.UserOut, m.user),
            status=m.status,
            progress=m.progress,
        )
        for m in members
    ]

@router.post("/{cohort_id}/members")
def add_member(
    cohort_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can add")
    user_id = payload.get("user_id")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    exists = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id,
        models.CohortMember.user_id == user_id
    ).first()
    if exists:
        return {"added": False, "message": "Already in cohort"}
    member = models.CohortMember(
        cohort_id=cohort_id,
        user_id=user_id,
        status="active",
        progress=0
    )
    db.add(member)
    db.commit()
    return {"added": True}

@router.put("/{cohort_id}/members/{user_id}")
def update_member(
    cohort_id: str,
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can update")
    member = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id,
        models.CohortMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if "status" in payload:
        member.status = payload["status"]
    if "progress" in payload:
        member.progress = payload["progress"]
    db.commit()
    return {"updated": True}

@router.delete("/{cohort_id}/members/{user_id}")
def remove_member(
    cohort_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    if current_user.role != "teacher" or cohort.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner teacher can remove member")
    deleted = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id,
        models.CohortMember.user_id == user_id
    ).delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"deleted": True}

@router.post("/join")
def join_cohort(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cohort_id = payload.get("cohort_id")
    code = payload.get("code")
    
    if not cohort_id:
        raise HTTPException(status_code=400, detail="cohort_id is required")
    
    cohort = db.query(models.Cohort).filter(models.Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    
    if cohort.code and cohort.code != code:
        raise HTTPException(status_code=403, detail="加入碼不正確")
    
    exists = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort_id,
        models.CohortMember.user_id == current_user.id
    ).first()
    if exists:
        return {"joined": False, "message": "已在群組中"}
    
    member = models.CohortMember(
        cohort_id=cohort_id,
        user_id=current_user.id,
        status="active",
        progress=0
    )
    db.add(member)
    db.commit()
    return {"joined": True}

@router.post("/join_by_code")
def join_cohort_by_code(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student can join cohort")
    code = payload.get("code")
    if not code or len(str(code)) != 9:
        raise HTTPException(status_code=400, detail="群組編號必須為 9 位數")
    cohort = db.query(models.Cohort).filter(models.Cohort.code == str(code)).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="找不到對應的群組")
    exists = db.query(models.CohortMember).filter(
        models.CohortMember.cohort_id == cohort.id,
        models.CohortMember.user_id == current_user.id,
    ).first()
    if exists:
        return {"joined": False, "message": "已在群組中"}
    member = models.CohortMember(
        cohort_id=cohort.id,
        user_id=current_user.id,
        status="active",
        progress=0
    )
    db.add(member)
    db.commit()
    return {"joined": True, "cohort_id": cohort.id}
