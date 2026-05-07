from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta, timezone


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
from pydantic import BaseModel
from database import get_db
from models import AppItem, UsageSession, LaunchEvent
from auth.jwt import get_current_user_id
from limiter import user_limiter
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
@user_limiter.limit("60/minute")
async def spending(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AppItem.id, AppItem.name, AppItem.slug, AppItem.plan, AppItem.frequency, AppItem.expires_at)
        .where(AppItem.user_id == user_id, AppItem.plan == "paid", AppItem.is_deleted == False)  # noqa: E712
        .limit(200)
    )
    rows = result.all()
    return [
        SpendingEntry(app_id=r.id, app_name=r.name, slug=r.slug, plan=r.plan, frequency=r.frequency, expires_at=r.expires_at)
        for r in rows
    ]


@router.get("/usage", response_model=List[UsageStat])
@user_limiter.limit("60/minute")
async def usage_stats(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    app_result = await db.execute(
        select(AppItem.id, AppItem.name, AppItem.slug)
        .where(AppItem.user_id == user_id, AppItem.is_deleted == False)  # noqa: E712
    )
    app_rows = app_result.all()
    app_map = {str(r.id): r for r in app_rows}

    usage_result = await db.execute(
        select(UsageSession.app_id, func.sum(UsageSession.duration_minutes).label("total"))
        .where(UsageSession.user_id == user_id)
        .group_by(UsageSession.app_id)
    )
    launch_result = await db.execute(
        select(LaunchEvent.app_id, func.count(LaunchEvent.id).label("cnt"))
        .where(LaunchEvent.user_id == user_id)
        .group_by(LaunchEvent.app_id)
    )

    usage_by_app = {str(r.app_id): int(r.total) for r in usage_result.all()}
    launches_by_app = {str(r.app_id): int(r.cnt) for r in launch_result.all()}

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
@user_limiter.limit("60/minute")
async def renewals(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=30)
    result = await db.execute(
        select(AppItem.id, AppItem.name, AppItem.slug, AppItem.expires_at)
        .where(
            AppItem.user_id == user_id,
            AppItem.expires_at.isnot(None),
            AppItem.expires_at <= cutoff,
            AppItem.is_deleted == False,  # noqa: E712
        )
        .order_by(AppItem.expires_at)
    )
    rows = result.all()
    return [
        RenewalEntry(
            app_id=r.id,
            app_name=r.name,
            slug=r.slug,
            expires_at=r.expires_at,
            days_until=max(0, (_as_utc(r.expires_at) - now).days),
        )
        for r in rows
    ]
