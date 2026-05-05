from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from database import get_db
from models import LaunchEvent
from models.launch_event import RETENTION_DAYS
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


class LaunchEventResponse(BaseModel):
    id: uuid.UUID
    app_id: uuid.UUID
    launched_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[LaunchEventResponse])
def get_launches(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return (
        db.query(LaunchEvent)
        .filter(LaunchEvent.user_id == user_id)
        .order_by(LaunchEvent.launched_at.desc())
        .limit(200)
        .all()
    )


@router.delete("/purge-old", status_code=200)
def purge_old_launches(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Delete launch events older than RETENTION_DAYS for the current user."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    deleted = (
        db.query(LaunchEvent)
        .filter(LaunchEvent.user_id == user_id, LaunchEvent.launched_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted": deleted, "cutoff": cutoff.isoformat()}
