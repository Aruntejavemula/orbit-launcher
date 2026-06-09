import uuid
from sqlalchemy import Column, Date, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class EngagementLog(Base):
    """One row per user/type/day — prevents duplicate engagement notifications."""

    __tablename__ = "engagement_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "type", "sent_date", name="uq_engagement_log_delivery"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    sent_date = Column(Date, nullable=False)
