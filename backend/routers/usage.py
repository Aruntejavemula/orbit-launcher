from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models import UsageSession
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


class UsageCreate(BaseModel):
    app_id: uuid.UUID
    duration_minutes: int


class UsageResponse(BaseModel):
    id: uuid.UUID
    app_id: uuid.UUID
    duration_minutes: int
    recorded_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[UsageResponse])
def get_usage(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(UsageSession)
        .filter(UsageSession.user_id == user_id)
        .order_by(UsageSession.recorded_at.desc())
        .limit(200)
        .all()
    )


@router.post("", response_model=UsageResponse, status_code=status.HTTP_201_CREATED)
def log_usage(body: UsageCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    session = UsageSession(user_id=user_id, app_id=body.app_id, duration_minutes=body.duration_minutes)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
