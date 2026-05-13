from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
import uuid

from database import get_db
from models import AppItem, UsageSession, LaunchEvent
from auth.jwt import get_current_user_id
from limiter import user_limiter
from utils import as_utc


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
        .where(AppItem.user_id == user_id, AppItem.plan == "paid", ~AppItem.is_deleted)
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
    usage_sub = (
        select(UsageSession.app_id, func.coalesce(func.sum(UsageSession.duration_minutes), 0).label("total"))
        .where(UsageSession.user_id == user_id)
        .group_by(UsageSession.app_id)
        .subquery()
    )
    launch_sub = (
        select(LaunchEvent.app_id, func.count(LaunchEvent.id).label("cnt"))
        .where(LaunchEvent.user_id == user_id)
        .group_by(LaunchEvent.app_id)
        .subquery()
    )
    stmt = (
        select(
            AppItem.id,
            AppItem.name,
            AppItem.slug,
            func.coalesce(usage_sub.c.total, 0).label("total_minutes"),
            func.coalesce(launch_sub.c.cnt, 0).label("launch_count"),
        )
        .outerjoin(usage_sub, AppItem.id == usage_sub.c.app_id)
        .outerjoin(launch_sub, AppItem.id == launch_sub.c.app_id)
        .where(AppItem.user_id == user_id, ~AppItem.is_deleted)
        .order_by(func.coalesce(usage_sub.c.total, 0).desc())
    )
    rows = (await db.execute(stmt)).all()
    return [
        UsageStat(
            app_id=r.id,
            app_name=r.name,
            slug=r.slug,
            total_minutes=int(r.total_minutes),
            launch_count=int(r.launch_count),
        )
        for r in rows
    ]


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
            days_until=max(0, (as_utc(r.expires_at) - now).days),
        )
        for r in rows
    ]
