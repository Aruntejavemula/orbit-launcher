from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Preferences
from models.preferences import ThemeEnum
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


class PreferencesResponse(BaseModel):
    id: uuid.UUID
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
    reminder_days: Optional[int] = None
    reminder_email: Optional[bool] = None
    reminder_push: Optional[bool] = None


@router.get("", response_model=PreferencesResponse)
def get_preferences(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    prefs = db.query(Preferences).filter(Preferences.user_id == user_id).first()
    if not prefs:
        prefs = Preferences(user_id=user_id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)
    return prefs


@router.patch("", response_model=PreferencesResponse)
def update_preferences(body: PreferencesUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    prefs = db.query(Preferences).filter(Preferences.user_id == user_id).first()
    if not prefs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(prefs, field, value)
    db.commit()
    db.refresh(prefs)
    return prefs
