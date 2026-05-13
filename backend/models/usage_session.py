import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Index, func, text
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class UsageSession(Base):
    __tablename__ = "usage_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id", ondelete="CASCADE"), nullable=False, index=True)
    duration_minutes = Column(Integer, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        # covers: GROUP BY app_id WHERE user_id = ? for insights
        Index("ix_usage_sessions_user_app", "user_id", "app_id"),
    )
