from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, Preferences
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdate
from auth.password import hash_password, verify_password
from auth.jwt import create_access_token, get_current_user_id
from auth.google import get_google_auth_url, exchange_code_for_user
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _create_default_prefs(db: Session, user_id: uuid.UUID):
    prefs = Preferences(user_id=user_id)
    db.add(prefs)
    db.commit()


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    _create_default_prefs(db, user.id)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/google")
def google_login():
    return RedirectResponse(get_google_auth_url())


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    try:
        guser = await exchange_code_for_user(code)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google auth failed")

    google_id = guser.get("sub")
    email = guser.get("email")
    name = guser.get("name", email)
    avatar = guser.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_id = google_id
            user.avatar_url = avatar or user.avatar_url
            db.commit()
        else:
            user = User(name=name, email=email, google_id=google_id, avatar_url=avatar)
            db.add(user)
            db.commit()
            db.refresh(user)
            _create_default_prefs(db, user.id)

    token = create_access_token(str(user.id))
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback?token={token}")


@router.get("/me", response_model=UserResponse)
def me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/me", response_model=UserResponse)
def update_me(body: UserUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
