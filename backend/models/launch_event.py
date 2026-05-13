import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Index, CheckConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from database import Base

RETENTION_DAYS = 90


class LaunchEvent(Base):
    __tablename__ = "launch_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id", ondelete="CASCADE"), nullable=False, index=True)
    launched_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    __table_args__ = (
        # covers: WHERE user_id = ? ORDER BY launched_at DESC LIMIT 200
        Index("ix_launch_events_user_launched_at", "user_id", text("launched_at DESC")),
        # DB rejects rows older than 90 days at insert time
        CheckConstraint(
            "launched_at >= (NOW() - INTERVAL '90 days')",
            name="ck_launch_events_retention_90d",
        ),
    )
