from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select


async def get_or_404(db: AsyncSession, stmt: Select, detail: str = "Not found."):
    result = await db.execute(stmt)
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return obj


def as_utc(dt: datetime) -> datetime:
    """Return dt as UTC-aware; safe whether DB gives naive or aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def apply_partial_update(obj: object, data: dict) -> None:
    for field, value in data.items():
        setattr(obj, field, value)
