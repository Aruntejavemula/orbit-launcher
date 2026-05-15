import uuid
from sqlalchemy import Column, Integer, Date, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class ReminderLog(Base):
    """One row per app/channel/day — prevents duplicate renewal notifications."""

    __tablename__ = "reminder_logs"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "app_id",
            "days_before",
            "channel",
            "sent_date",
            name="uq_reminder_log_delivery",
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    app_id = Column(UUID(as_uuid=True), ForeignKey("apps.id", ondelete="CASCADE"), nullable=False, index=True)
    days_before = Column(Integer, nullable=False)
    channel = Column(String(10), nullable=False)  # email | push
    sent_date = Column(Date, nullable=False)
