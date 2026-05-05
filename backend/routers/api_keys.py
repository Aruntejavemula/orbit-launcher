from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models import ApiKey
from auth.jwt import get_current_user_id
from auth.password import hash_password
import uuid
import secrets

router = APIRouter()


class ApiKeyCreate(BaseModel):
    name: str


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
def list_keys(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(ApiKey).filter(ApiKey.user_id == user_id).order_by(ApiKey.created_at.desc()).limit(50).all()


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_key(body: ApiKeyCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    raw = secrets.token_urlsafe(32)
    prefix = raw[:8]
    key = ApiKey(
        user_id=user_id,
        name=body.name,
        prefix=prefix,
        secret_hash=hash_password(raw),
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    return ApiKeyCreatedResponse(
        id=key.id,
        name=key.name,
        prefix=key.prefix,
        created_at=key.created_at,
        last_used_at=key.last_used_at,
        secret=raw,
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key(key_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user_id).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")
    db.delete(key)
    db.commit()
