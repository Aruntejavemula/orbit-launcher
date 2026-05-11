from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from typing import List
from datetime import datetime, timezone
from database import get_db
from models import AppItem
from schemas.app import AppCreate, AppUpdate, AppResponse, ReorderItem
from auth.jwt import get_current_user_id
from limiter import limiter, user_limiter
from utils import get_or_404, apply_partial_update
import uuid

router = APIRouter()


def _active_q(user_id: str):
    return select(AppItem).where(AppItem.user_id == user_id, ~AppItem.is_deleted)


async def _get_app_or_404(app_id: uuid.UUID, user_id: str, db: AsyncSession) -> AppItem:
    return await get_or_404(db, _active_q(user_id).where(AppItem.id == app_id), "That app could not be found.")


@router.get("", response_model=List[AppResponse])
@user_limiter.limit("60/minute")
async def list_apps(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(_active_q(user_id).order_by(AppItem.display_order).limit(200))
    return result.scalars().all()


@router.post("", response_model=AppResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
@user_limiter.limit("30/minute")
async def create_app(request: Request, body: AppCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    max_order_result = await db.execute(
        select(func.coalesce(func.max(AppItem.display_order) + 1, 0))
        .where(AppItem.user_id == user_id, ~AppItem.is_deleted)
    )
    max_order = max_order_result.scalar_one() or 0
    data = body.model_dump()
    data["url"] = str(data["url"])
    if data.get("manage_url"):
        data["manage_url"] = str(data["manage_url"])
    app = AppItem(**data, user_id=user_id, display_order=max_order)
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


@router.patch("/{app_id}", response_model=AppResponse)
@limiter.limit("30/minute")
@user_limiter.limit("30/minute")
async def update_app(request: Request, app_id: uuid.UUID, body: AppUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    app = await _get_app_or_404(app_id, user_id, db)
    data = body.model_dump(exclude_unset=True)
    for field in ("url", "manage_url"):
        if field in data and data[field] is not None:
            data[field] = str(data[field])
    apply_partial_update(app, data)
    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
@user_limiter.limit("30/minute")
async def delete_app(request: Request, app_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    app = await _get_app_or_404(app_id, user_id, db)
    app.is_deleted = True
    app.deleted_at = datetime.now(timezone.utc)
    await db.commit()


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
@user_limiter.limit("30/minute")
async def reorder_apps(request: Request, items: List[ReorderItem], user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    if not items:
        return

    ids = [item.id for item in items]
    if len(ids) != len(set(ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate app IDs in reorder payload.")

    result = await db.execute(
        select(AppItem.id).where(AppItem.user_id == user_id, ~AppItem.is_deleted, AppItem.id.in_(ids))
    )
    existing_ids = {row[0] for row in result.all()}
    missing = set(ids) - existing_ids
    if missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more apps in reorder payload could not be found.")

    for item in items:
        await db.execute(
            update(AppItem)
            .where(AppItem.id == item.id, AppItem.user_id == user_id)
            .values(display_order=item.order)
        )
    await db.commit()


@router.post("/{app_id}/launch", response_model=AppResponse)
@user_limiter.limit("30/minute")
async def launch_app(request: Request, app_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    from models import LaunchEvent
    app = await _get_app_or_404(app_id, user_id, db)
    app.last_opened_at = datetime.now(timezone.utc)
    event = LaunchEvent(user_id=user_id, app_id=app_id)
    db.add(event)
    await db.commit()
    await db.refresh(app)
    return app
