from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
import auth as auth_module
import models
from schemas import UserResponse, TokenWithUser, LoginRequest, UserCreate

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Helper function for Pydantic v1/v2 compatibility
def to_pydantic(model_class, obj):
    """Convert SQLAlchemy model to Pydantic model, compatible with both v1 and v2."""
    try:
        # Pydantic v2
        return model_class.model_validate(obj)
    except AttributeError:
        # Pydantic v1
        return model_class.from_orm(obj)

@router.post("/register", response_model=UserResponse)
async def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = auth_module.get_user_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = auth_module.get_password_hash(payload.password)
    new_user = models.User(
        id=models.generate_uuid(),
        email=payload.email,
        name=payload.name,
        password_hash=hashed_password,
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return to_pydantic(UserResponse, new_user)

@router.post("/login", response_model=TokenWithUser)
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = auth_module.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth_module.create_access_token(data={"sub": user.id})
    user_response = to_pydantic(UserResponse, user)
    return TokenWithUser(access_token=access_token, token_type="bearer", user=user_response)
