from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Literal, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from database import get_db
from models import AppItem
from auth.jwt import get_current_user_id
from limiter import user_limiter
import uuid

router = APIRouter()

YELLOW_THRESHOLD_DAYS = 7
RED_THRESHOLD_DAYS = 15


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _activity_status(last_opened_at: datetime | None, now: datetime) -> Literal["green", "yellow", "red"]:
    if last_opened_at is None:
        return "red"
    days_inactive = (now - _ensure_utc(last_opened_at)).days
    if days_inactive >= RED_THRESHOLD_DAYS:
        return "red"
    if days_inactive >= YELLOW_THRESHOLD_DAYS:
        return "yellow"
    return "green"


def _activity_message(last_opened_at: datetime | None, now: datetime) -> str:
    if last_opened_at is None:
        return "Never opened — consider unsubscribing?"
    days = (now - _ensure_utc(last_opened_at)).days
    if days >= RED_THRESHOLD_DAYS:
        return f"Not used for {days} days — do you want to consider unsubscribing?"
    if days >= YELLOW_THRESHOLD_DAYS:
        return f"Not used for {days} days"
    if days == 0:
        return "Used today"
    if days == 1:
        return "Used yesterday"
    return f"Used {days} days ago"


class ActivityEntry(BaseModel):
    app_id: uuid.UUID
    app_name: str
    slug: str
    color: str
    icon_key: str | None
    plan: str
    status: Literal["green", "yellow", "red"]
    message: str
    last_opened_at: datetime | None
    days_inactive: Optional[int]

    class Config:
        from_attributes = True


@router.get("", response_model=List[ActivityEntry])
@user_limiter.limit("60/minute")
async def get_activity(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AppItem)
        .where(AppItem.user_id == user_id, ~AppItem.is_deleted)
        .order_by(AppItem.last_opened_at.asc().nullsfirst())
    )
    apps = result.scalars().all()
    now = datetime.now(timezone.utc)
    entries = []
    for app in apps:
        status = _activity_status(app.last_opened_at, now)
        message = _activity_message(app.last_opened_at, now)
        if app.last_opened_at is not None:
            days_inactive = (now - _ensure_utc(app.last_opened_at)).days
        else:
            days_inactive = None
        entries.append(ActivityEntry(
            app_id=app.id,
            app_name=app.name,
            slug=app.slug,
            color=app.color,
            icon_key=app.icon_key,
            plan=app.plan.value if hasattr(app.plan, "value") else app.plan,
            status=status,
            message=message,
            last_opened_at=app.last_opened_at,
            days_inactive=days_inactive,
        ))
    return entries
