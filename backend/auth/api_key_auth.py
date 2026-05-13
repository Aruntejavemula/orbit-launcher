"""API key authentication — look up a raw key, verify its hash, return the owner."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker
from database import AsyncSessionLocal
from models import ApiKey
from auth.password import verify_password


async def resolve_api_key(
    raw_key: str,
    session_factory: async_sessionmaker | None = None,
) -> Optional[UUID]:
    """Return the user_id if *raw_key* matches a stored API key, else None."""
    if len(raw_key) < 9:
        return None

    prefix = raw_key[:8]
    factory = session_factory or AsyncSessionLocal

    async with factory() as session:
        result = await session.execute(
            select(ApiKey).where(ApiKey.prefix == prefix)
        )
        key = result.scalar_one_or_none()
        if key is None:
            return None

        if not verify_password(raw_key, key.secret_hash):
            return None

        update_result = await session.execute(
            update(ApiKey)
            .where(ApiKey.id == key.id)
            .values(last_used_at=datetime.now(timezone.utc))
        )
        if update_result.rowcount != 1:
            await session.rollback()
            return None
        await session.commit()

        return key.user_id
