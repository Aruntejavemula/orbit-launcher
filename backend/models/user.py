import uuid
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class SubscriptionStatusEnum(str, enum.Enum):
    active = "active"
    canceled = "canceled"
    trialing = "trialing"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=True)
    google_id = Column(String(128), nullable=True, unique=True, index=True)
    avatar_url = Column(Text, nullable=True)
    subscription_status = Column(
        Enum(SubscriptionStatusEnum, name="subscriptionstatusenum", create_type=False),
        nullable=False,
        server_default="trialing",
        default=SubscriptionStatusEnum.trialing,
    )
    token_version = Column(Integer, nullable=False, server_default="0", default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
