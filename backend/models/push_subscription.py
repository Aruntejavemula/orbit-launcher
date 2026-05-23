import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(16), nullable=False, default="web", server_default="web")
    endpoint = Column(Text, nullable=True)
    p256dh = Column(Text, nullable=True)
    auth = Column(Text, nullable=True)
    fcm_token = Column(Text, nullable=True, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
