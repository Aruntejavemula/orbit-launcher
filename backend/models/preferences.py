import uuid
from sqlalchemy import Column, Boolean, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import enum


class ThemeEnum(str, enum.Enum):
    light = "light"
    dark = "dark"


class Preferences(Base):
    __tablename__ = "preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    theme = Column(Enum(ThemeEnum), nullable=False, default=ThemeEnum.light)
    start_week_on_monday = Column(Boolean, nullable=False, default=False)
    compact_cards = Column(Boolean, nullable=False, default=False)
    show_last_opened = Column(Boolean, nullable=False, default=True)
    notify_expirations = Column(Boolean, nullable=False, default=True)
    reminder_days = Column(Integer, nullable=False, default=7)
    reminder_email = Column(Boolean, nullable=False, default=True)
    reminder_push = Column(Boolean, nullable=False, default=False)
    onboarding_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
