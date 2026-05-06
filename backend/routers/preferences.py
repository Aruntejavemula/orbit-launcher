from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional
from database import get_db
from models import Preferences
from models.preferences import ThemeEnum
from auth.jwt import get_current_user_id

router = APIRouter()


class PreferencesResponse(BaseModel):
    theme: ThemeEnum
    start_week_on_monday: bool
    compact_cards: bool
    show_last_opened: bool
    notify_expirations: bool
    reminder_days: int
    reminder_email: bool
    reminder_push: bool

    class Config:
        from_attributes = True


class PreferencesUpdate(BaseModel):
    theme: Optional[ThemeEnum] = None
    start_week_on_monday: Optional[bool] = None
    compact_cards: Optional[bool] = None
    show_last_opened: Optional[bool] = None
    notify_expirations: Optional[bool] = None
    reminder_days: Optional[int] = Field(default=None, ge=1, le=365)
    reminder_email: Optional[bool] = None
    reminder_push: Optional[bool] = None


@router.get("", response_model=PreferencesResponse)
async def get_preferences(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    prefs = result.scalar_one_or_none()
    if not prefs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found. Please reload the page.")
    return prefs


@router.post("/init", response_model=PreferencesResponse, status_code=201)
async def init_preferences(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    prefs = result.scalar_one_or_none()
    if prefs:
        return prefs
    prefs = Preferences(user_id=user_id)
    db.add(prefs)
    await db.commit()
    await db.refresh(prefs)
    return prefs


@router.patch("", response_model=PreferencesResponse)
async def update_preferences(body: PreferencesUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    prefs = result.scalar_one_or_none()
    if not prefs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Your preferences could not be found. Please reload the page.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    await db.commit()
    await db.refresh(prefs)
    return prefs
