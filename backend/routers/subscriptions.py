from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from auth.jwt import get_current_user_id
from limiter import user_limiter
import logging

logger = logging.getLogger("orbit")
router = APIRouter()


class CancelReasonRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class ClaimOfferRequest(BaseModel):
    offer_id: str = Field(min_length=1, max_length=100)


@router.post("/cancel-reason", status_code=204)
@user_limiter.limit("10/minute")
async def log_cancel_reason(
    request: Request,
    body: CancelReasonRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info("cancel_reason user=%s reason=%r", user_id, body.reason)


@router.post("/claim-offer", status_code=204)
@user_limiter.limit("10/minute")
async def claim_offer(
    request: Request,
    body: ClaimOfferRequest,
    user_id: str = Depends(get_current_user_id),
):
    logger.info("offer_claimed user=%s offer=%r", user_id, body.offer_id)


@router.post("/cancel", status_code=204)
@user_limiter.limit("5/minute")
async def cancel_subscription(
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    logger.info("subscription_cancelled user=%s", user_id)
