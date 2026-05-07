from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from database import get_db
from models.push_subscription import PushSubscription
from auth.jwt import get_current_user_id
from limiter import limiter
import os

router = APIRouter()

_VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")


class SubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("/vapid-key")
async def vapid_key():
    if not _VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"public_key": _VAPID_PUBLIC_KEY}


@router.post("/subscribe", status_code=201)
@limiter.limit("10/minute")
async def subscribe(
    request: Request,
    body: SubscribeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(PushSubscription).where(PushSubscription.endpoint == body.endpoint)
    )
    sub = existing.scalar_one_or_none()
    if sub:
        sub.user_id = user_id
        sub.p256dh = body.p256dh
        sub.auth = body.auth
    else:
        sub = PushSubscription(
            user_id=user_id,
            endpoint=body.endpoint,
            p256dh=body.p256dh,
            auth=body.auth,
        )
        db.add(sub)
    await db.commit()
    return {"ok": True}


@router.delete("/unsubscribe", status_code=204)
@limiter.limit("10/minute")
async def unsubscribe(
    request: Request,
    body: SubscribeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(PushSubscription).where(
            PushSubscription.endpoint == body.endpoint,
            PushSubscription.user_id == user_id,
        )
    )
    await db.commit()
    return None
