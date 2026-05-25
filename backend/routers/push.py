from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field, model_validator
from database import get_db
from models.push_subscription import PushSubscription
from auth.jwt import get_current_user_id
from limiter import limiter
from tasks.send_fcm import send_fcm_notification
from tasks.send_push import send_push_notification
import os
router = APIRouter()

_VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
def _test_push_enabled() -> bool:
    raw = (
        os.getenv("ALLOW_TEST_PUSH")
        or os.getenv("allow_test_push")
        or ""
    ).strip().lower()
    return raw in ("1", "true", "yes", "on")

_TEST_PUSH_PAYLOAD = {
    "title": "Hello",
    "body": "Hi from Remio",
    "url": "/",
}


class SubscribeRequest(BaseModel):
    platform: Literal["web", "android"] = "web"
    endpoint: str | None = Field(default=None, max_length=2048)
    p256dh: str | None = Field(default=None, max_length=256)
    auth: str | None = Field(default=None, max_length=256)
    fcm_token: str | None = Field(default=None, max_length=4096)

    @model_validator(mode="after")
    def validate_platform_fields(self) -> "SubscribeRequest":
        if self.platform == "web":
            if not self.endpoint or not self.p256dh or not self.auth:
                raise ValueError("web subscribe requires endpoint, p256dh, and auth")
        elif self.platform == "android":
            if not self.fcm_token:
                raise ValueError("android subscribe requires fcm_token")
        return self


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
    if body.platform == "android":
        existing = await db.execute(
            select(PushSubscription).where(
                PushSubscription.fcm_token == body.fcm_token,
                PushSubscription.user_id == user_id,
            )
        )
        sub = existing.scalar_one_or_none()
        if sub:
            sub.platform = "android"
        else:
            other = await db.execute(
                select(PushSubscription).where(
                    PushSubscription.fcm_token == body.fcm_token,
                )
            )
            if other.scalar_one_or_none():
                await db.execute(
                    delete(PushSubscription).where(PushSubscription.fcm_token == body.fcm_token)
                )
            sub = PushSubscription(
                user_id=user_id,
                platform="android",
                fcm_token=body.fcm_token,
                endpoint=None,
                p256dh=None,
                auth=None,
            )
            db.add(sub)
    else:
        existing = await db.execute(
            select(PushSubscription).where(
                PushSubscription.endpoint == body.endpoint,
                PushSubscription.user_id == user_id,
            )
        )
        sub = existing.scalar_one_or_none()
        if sub:
            sub.platform = "web"
            sub.p256dh = body.p256dh
            sub.auth = body.auth
            sub.fcm_token = None
        else:
            sub = PushSubscription(
                user_id=user_id,
                platform="web",
                endpoint=body.endpoint,
                p256dh=body.p256dh,
                auth=body.auth,
                fcm_token=None,
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
    if body.platform == "android" and body.fcm_token:
        await db.execute(
            delete(PushSubscription).where(
                PushSubscription.fcm_token == body.fcm_token,
                PushSubscription.user_id == user_id,
            )
        )
    elif body.endpoint:
        await db.execute(
            delete(PushSubscription).where(
                PushSubscription.endpoint == body.endpoint,
                PushSubscription.user_id == user_id,
            )
        )
    await db.commit()
    return None


@router.post("/test")
@limiter.limit("5/minute")
async def test_push(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Send an immediate test notification. Gate with ALLOW_TEST_PUSH=1; remove after device testing."""
    if not _test_push_enabled():
        raise HTTPException(
            status_code=503,
            detail="Test push disabled. On the API Railway service set ALLOW_TEST_PUSH=1 (exact name) and redeploy.",
        )

    subs = (
        await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    ).scalars().all()
    if not subs:
        raise HTTPException(
            status_code=404,
            detail="No push subscription. Enable notifications and sign in again.",
        )

    sent = 0
    failed = 0
    for sub in subs:
        ok = False
        if sub.platform == "android" and sub.fcm_token:
            ok = send_fcm_notification(sub.fcm_token, _TEST_PUSH_PAYLOAD)
        elif sub.endpoint and sub.p256dh and sub.auth:
            ok = send_push_notification(sub.endpoint, sub.p256dh, sub.auth, _TEST_PUSH_PAYLOAD)
        if ok:
            sent += 1
        else:
            failed += 1

    if sent == 0:
        raise HTTPException(
            status_code=503,
            detail="Push send failed. Check FIREBASE_* on the server and FCM token subscribe.",
        )

    return {"ok": True, "sent": sent, "failed": failed}
