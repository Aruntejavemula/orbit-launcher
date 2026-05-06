from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
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
    app_id: uuid.UUID
    launched_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[LaunchEventResponse])
async def get_launches(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LaunchEvent)
        .where(LaunchEvent.user_id == user_id)
        .order_by(LaunchEvent.launched_at.desc())
        .limit(200)
    )
    return result.scalars().all()


@router.delete("/purge-old", status_code=200)
async def purge_old_launches(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    result = await db.execute(
        delete(LaunchEvent)
        .where(LaunchEvent.user_id == user_id, LaunchEvent.launched_at < cutoff)
        .returning(LaunchEvent.id)
    )
    deleted = len(result.fetchall())
    await db.commit()
    return {"deleted": deleted, "cutoff": cutoff.isoformat()}
