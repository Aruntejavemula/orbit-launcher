from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from pydantic import BaseModel, Field
from database import get_db
from models import UsageSession
from auth.jwt import get_current_user_id
from limiter import user_limiter
import uuid

router = APIRouter()


class UsageCreate(BaseModel):
    app_id: uuid.UUID
    duration_minutes: int = Field(ge=1, le=1440)


class UsageResponse(BaseModel):
    app_id: uuid.UUID
    duration_minutes: int
    recorded_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[UsageResponse])
@user_limiter.limit("60/minute")
async def get_usage(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UsageSession)
        .where(UsageSession.user_id == user_id)
        .order_by(UsageSession.recorded_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.post("", response_model=UsageResponse, status_code=status.HTTP_201_CREATED)
@user_limiter.limit("60/minute")
async def log_usage(request: Request, body: UsageCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    session = UsageSession(user_id=user_id, app_id=body.app_id, duration_minutes=body.duration_minutes)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session
