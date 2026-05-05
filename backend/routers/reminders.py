from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from database import get_db
from models import Reminder
from models.reminder import ReminderMethodEnum
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


class ReminderCreate(BaseModel):
    app_id: uuid.UUID
    remind_days_before: int = 7
    method: ReminderMethodEnum = ReminderMethodEnum.email


class ReminderUpdate(BaseModel):
    remind_days_before: int | None = None
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
def list_reminders(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Reminder).filter(Reminder.user_id == user_id).limit(200).all()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(body: ReminderCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    r = Reminder(user_id=user_id, **body.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: uuid.UUID, body: ReminderUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    db.delete(r)
    db.commit()
