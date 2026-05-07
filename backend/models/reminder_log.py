import uuid
from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class ReminderLog(Base):
    __tablename__ = "reminder_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "days_before", "sent_date", name="uq_reminder_log_user_day"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    days_before = Column(Integer, nullable=False)
    sent_date = Column(Date, nullable=False, server_default=func.current_date())
