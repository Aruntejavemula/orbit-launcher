from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
import uuid


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

    @field_validator("avatar_url")
    @classmethod
    def avatar_must_be_url(cls, v: Optional[str]) -> Optional[str]:
        if v and not (v.startswith("http://") or v.startswith("https://") or v.startswith("data:")):
            raise ValueError("avatar_url must be a valid URL")
        return v


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True
