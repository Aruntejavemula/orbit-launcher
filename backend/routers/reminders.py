from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, Field
from database import get_db
from models import Reminder
from models.app_item import AppItem
from models.reminder import ReminderMethodEnum
from auth.jwt import get_current_user_id
from limiter import limiter
import uuid

router = APIRouter()


class ReminderCreate(BaseModel):
    app_id: uuid.UUID
    remind_days_before: int = Field(default=7, ge=1, le=365)
    method: ReminderMethodEnum = ReminderMethodEnum.email


class ReminderUpdate(BaseModel):
    remind_days_before: int | None = Field(default=None, ge=1, le=365)
    method: ReminderMethodEnum | None = None
    active: bool | None = None


class ReminderResponse(BaseModel):
    id: uuid.UUID
    app_id: uuid.UUID
    remind_days_before: int
    method: ReminderMethodEnum
    active: bool

    class Config:
        from_attributes = True


@router.get("", response_model=List[ReminderResponse])
async def list_reminders(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.user_id == user_id).limit(200))
    return result.scalars().all()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_reminder(request: Request, body: ReminderCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    app_result = await db.execute(
        select(AppItem).where(AppItem.id == body.app_id, AppItem.user_id == user_id, ~AppItem.is_deleted)
    )
    if not app_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="App not found.")
    r = Reminder(user_id=user_id, **body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return r


@router.patch("/{reminder_id}", response_model=ReminderResponse)
@limiter.limit("30/minute")
async def update_reminder(request: Request, reminder_id: uuid.UUID, body: ReminderUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That reminder could not be found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    await db.commit()
    await db.refresh(r)
    return r


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def delete_reminder(request: Request, reminder_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That reminder could not be found.")
    await db.delete(r)
    await db.commit()
