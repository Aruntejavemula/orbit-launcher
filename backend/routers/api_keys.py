from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from database import get_db
from models import ApiKey
from auth.jwt import get_current_user_id
from auth.password import hash_password
from limiter import limiter
import uuid
import secrets

router = APIRouter()


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    prefix: str
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    secret: str  # returned only on creation


@router.get("", response_model=List[ApiKeyResponse])
async def list_keys(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApiKey).where(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc()).limit(50)
    )
    return result.scalars().all()


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_key(request: Request, body: ApiKeyCreate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    raw = secrets.token_urlsafe(32)
    prefix = raw[:8]
    key = ApiKey(
        user_id=user_id,
        name=body.name,
        prefix=prefix,
        secret_hash=hash_password(raw),
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return ApiKeyCreatedResponse(
        id=key.id,
        name=key.name,
        prefix=key.prefix,
        created_at=key.created_at,
        last_used_at=key.last_used_at,
        secret=raw,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_key(request: Request, key_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == user_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That API key could not be found.")
    await db.delete(key)
    await db.commit()
