from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from database import get_db
from auth.jwt import get_current_user_id
import logging

logger = logging.getLogger("orbit")
router = APIRouter()


class CancelReasonRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


class ClaimOfferRequest(BaseModel):
    offer_id: str = Field(min_length=1, max_length=100)


@router.post("/cancel-reason", status_code=204)
async def log_cancel_reason(
    body: CancelReasonRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    logger.info("cancel_reason user=%s reason=%r", user_id, body.reason)


@router.post("/claim-offer", status_code=204)
async def claim_offer(
    body: ClaimOfferRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    logger.info("offer_claimed user=%s offer=%r", user_id, body.offer_id)


@router.post("/cancel", status_code=204)
async def cancel_subscription(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    logger.info("subscription_cancelled user=%s", user_id)
