from pydantic import BaseModel, Field, field_validator, AnyHttpUrl
from typing import Optional
from datetime import datetime
import uuid
import re
from models.app_item import PlanEnum, BillingFrequencyEnum, CategoryEnum

_HEX_COLOR = re.compile(r"^[0-9A-Fa-f]{6}$")


def _validate_color(v: Optional[str]) -> Optional[str]:
    if v and not _HEX_COLOR.match(v):
        raise ValueError("color must be a 6-char hex string e.g. FF5733")
    return v


class AppCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9\-]+$")
    color: str = Field(min_length=6, max_length=6)
    url: AnyHttpUrl
    category: CategoryEnum
    plan: PlanEnum = PlanEnum.free
    expires_at: Optional[datetime] = None
    manage_url: Optional[AnyHttpUrl] = None
    icon_key: Optional[str] = Field(default=None, max_length=80)
    frequency: Optional[BillingFrequencyEnum] = None

    @field_validator("color")
    @classmethod
    def color_hex(cls, v: str) -> str:
        return _validate_color(v)  # type: ignore[return-value]


class AppUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    slug: Optional[str] = Field(default=None, min_length=1, max_length=80, pattern=r"^[a-z0-9\-]+$")
    color: Optional[str] = Field(default=None, min_length=6, max_length=6)
    url: Optional[AnyHttpUrl] = None
    category: Optional[CategoryEnum] = None
    plan: Optional[PlanEnum] = None
    expires_at: Optional[datetime] = None
    manage_url: Optional[AnyHttpUrl] = None
    icon_key: Optional[str] = Field(default=None, max_length=80)
    frequency: Optional[BillingFrequencyEnum] = None
    pending_unsubscribe_at: Optional[datetime] = None
    display_order: Optional[int] = Field(default=None, ge=0)

    @field_validator("color")
    @classmethod
    def color_hex(cls, v: Optional[str]) -> Optional[str]:
        return _validate_color(v)


class AppResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    color: str
    url: str
    category: CategoryEnum
    plan: PlanEnum
    expires_at: Optional[datetime] = None
    manage_url: Optional[str] = None
    icon_key: Optional[str] = None
    frequency: Optional[BillingFrequencyEnum] = None
    pending_unsubscribe_at: Optional[datetime] = None
    display_order: int
    created_at: datetime
    last_opened_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReorderItem(BaseModel):
    id: uuid.UUID
    order: int
