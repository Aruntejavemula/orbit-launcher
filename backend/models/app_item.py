import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Index, UniqueConstraint, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import enum


class PlanEnum(str, enum.Enum):
    paid = "paid"
    free = "free"
    trial = "trial"


class BillingFrequencyEnum(str, enum.Enum):
    monthly = "monthly"
    quarterly = "quarterly"
    yearly = "yearly"


class CategoryEnum(str, enum.Enum):
    ai = "ai"
    design = "design"
    productivity = "productivity"
    finance = "finance"
    music = "music"


class AppItem(Base):
    __tablename__ = "apps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(80), nullable=False)
    color = Column(String(6), nullable=False)
    url = Column(String(2048), nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    plan = Column(Enum(PlanEnum), nullable=False, default=PlanEnum.free)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    manage_url = Column(String(2048), nullable=True)
    icon_key = Column(String(80), nullable=True)
    frequency = Column(Enum(BillingFrequencyEnum), nullable=True)
    pending_unsubscribe_at = Column(DateTime(timezone=True), nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    is_deleted = Column(Boolean, nullable=False, default=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_opened_at = Column(DateTime(timezone=True), nullable=True)
    monthly_cost = Column(Numeric(10, 2), nullable=True)

    __table_args__ = (
        Index("ix_apps_user_display_order", "user_id", "display_order"),
        Index("ix_apps_user_expires_at", "user_id", "expires_at"),
        Index("uq_apps_user_slug_active", "user_id", "slug", unique=True,
              postgresql_where=~Column("is_deleted")),
    )
