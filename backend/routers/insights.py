from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from database import get_db
from models import AppItem, UsageSession, LaunchEvent
from auth.jwt import get_current_user_id
import uuid

router = APIRouter()


class SpendingEntry(BaseModel):
    app_id: uuid.UUID
    app_name: str
    slug: str
    plan: str
    frequency: str | None
    expires_at: datetime | None


class UsageStat(BaseModel):
    app_id: uuid.UUID
    app_name: str
    slug: str
    total_minutes: int
    launch_count: int


class RenewalEntry(BaseModel):
    app_id: uuid.UUID
    app_name: str
    slug: str
    expires_at: datetime
    days_until: int


@router.get("/spending", response_model=List[SpendingEntry])
def spending(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rows = (
        db.query(AppItem.id, AppItem.name, AppItem.slug, AppItem.plan, AppItem.frequency, AppItem.expires_at)
        .filter(AppItem.user_id == user_id, AppItem.plan == "paid", AppItem.is_deleted == False)  # noqa: E712
        .limit(200)
        .all()
    )
    return [
        SpendingEntry(app_id=r.id, app_name=r.name, slug=r.slug, plan=r.plan, frequency=r.frequency, expires_at=r.expires_at)
        for r in rows
    ]


@router.get("/usage", response_model=List[UsageStat])
def usage_stats(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    app_rows = (
        db.query(AppItem.id, AppItem.name, AppItem.slug)
        .filter(AppItem.user_id == user_id, AppItem.is_deleted == False)  # noqa: E712
        .all()
    )
    app_map = {str(r.id): r for r in app_rows}

    usage_rows = (
        db.query(UsageSession.app_id, func.sum(UsageSession.duration_minutes).label("total"))
        .filter(UsageSession.user_id == user_id)
        .group_by(UsageSession.app_id)
        .all()
    )
    launch_rows = (
        db.query(LaunchEvent.app_id, func.count(LaunchEvent.id).label("cnt"))
        .filter(LaunchEvent.user_id == user_id)
        .group_by(LaunchEvent.app_id)
        .all()
    )

    usage_by_app = {str(r.app_id): int(r.total) for r in usage_rows}
    launches_by_app = {str(r.app_id): int(r.cnt) for r in launch_rows}

    result = [
        UsageStat(
            app_id=r.id,
            app_name=r.name,
            slug=r.slug,
            total_minutes=usage_by_app.get(aid, 0),
            launch_count=launches_by_app.get(aid, 0),
        )
        for aid, r in app_map.items()
    ]
    return sorted(result, key=lambda x: x.total_minutes, reverse=True)


@router.get("/renewals", response_model=List[RenewalEntry])
def renewals(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=30)
    rows = (
        db.query(AppItem.id, AppItem.name, AppItem.slug, AppItem.expires_at)
        .filter(
            AppItem.user_id == user_id,
            AppItem.expires_at.isnot(None),
            AppItem.expires_at <= cutoff,
            AppItem.is_deleted == False,  # noqa: E712
        )
        .order_by(AppItem.expires_at)
        .all()
    )
    return [
        RenewalEntry(
            app_id=r.id,
            app_name=r.name,
            slug=r.slug,
            expires_at=r.expires_at,
            days_until=max(0, (r.expires_at.replace(tzinfo=timezone.utc) - now).days),
        )
        for r in rows
    ]
