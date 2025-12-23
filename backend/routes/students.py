from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
import models
import schemas
from auth import get_current_user, get_password_hash

router = APIRouter(prefix="/api/students", tags=["students"])

# Helper function for Pydantic v1/v2 compatibility
def to_pydantic(model_class, obj):
    """Convert SQLAlchemy model to Pydantic model, compatible with both v1 and v2."""
    try:
        # Pydantic v2
        return model_class.model_validate(obj)
    except AttributeError:
        # Pydantic v1
        return model_class.from_orm(obj)

@router.get("", response_model=list[schemas.UserOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can list students")
    students = db.query(models.User).filter(models.User.role == "student").order_by(models.User.created_at.desc()).all()
    return [to_pydantic(schemas.UserOut, u) for u in students]

@router.post("", response_model=schemas.UserOut)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create student")
    exists = db.query(models.User).filter(models.User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already exists")
    u = models.User(
        email=payload.email,
        name=payload.name,
        role="student",
        password_hash=get_password_hash(payload.password)
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return to_pydantic(schemas.UserOut, u)

@router.post("/bulk", response_model=list[schemas.UserOut])
def bulk_create_students(
    payload: schemas.BulkStudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can create student")
    if payload.start_no > payload.end_no:
        raise HTTPException(status_code=400, detail="start_no must be <= end_no")

    created: list[schemas.UserOut] = []
    for n in range(payload.start_no, payload.end_no + 1):
        seat = str(n).zfill(payload.zero_pad or 1)
        email = f"{payload.email_prefix}{seat}{payload.email_domain}"
        name = f"{payload.name_prefix}{seat}"

        exists = db.query(models.User).filter(models.User.email == email).first()
        if exists:
            continue
        u = models.User(
            email=email,
            name=name,
            role="student",
            password_hash=get_password_hash(payload.password),
        )
        db.add(u)
        db.flush()
        created.append(to_pydantic(schemas.UserOut, u))

    db.commit()
    return created

@router.get("/{student_id}", response_model=schemas.UserOut)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    return to_pydantic(schemas.UserOut, user)

@router.put("/{student_id}", response_model=schemas.UserOut)
def update_student(
    student_id: str,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can update student")
    user = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    if payload.email:
        exists = db.query(models.User).filter(models.User.email == payload.email, models.User.id != student_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email already exists")
        user.email = payload.email
    if payload.name:
        user.name = payload.name
    if payload.password:
        user.password_hash = get_password_hash(payload.password)
    db.commit()
    db.refresh(user)
    return to_pydantic(schemas.UserOut, user)

@router.delete("/{student_id}")
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher can delete student")
    deleted = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").delete()
    db.commit()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"deleted": True}
