from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, EmailStr, Field
from jose import JWTError, jwt
from database import get_db
from models import User, Preferences
from models.otp import PasswordResetOtp
from schemas.auth import RegisterRequest, LoginRequest, UserResponse, UserUpdate
from auth.password import hash_password, verify_password
from auth.password_policy import validate_password
from auth.jwt import COOKIE_NAME, EXPIRE_MINUTES, create_access_token, get_current_user_id
from auth.google import get_google_auth_url, exchange_code_for_user
from auth.email_otp import generate_otp, send_otp_email
from job_queue import enqueue_send_otp
from limiter import limiter
from utils import get_or_404
from dotenv import load_dotenv
import os
import asyncio
import uuid
from datetime import datetime, timedelta, timezone


def _as_utc(dt: datetime) -> datetime:
    """Return dt as UTC-aware; safe whether DB gives naive or aware."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

load_dotenv()

_JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
_JWT_ALGO = os.getenv("JWT_ALGORITHM", "HS256")

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

_IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"


async def _create_default_prefs(db: AsyncSession, user_id: uuid.UUID):
    prefs = Preferences(user_id=user_id)
    db.add(prefs)
    await db.commit()


_REMEMBER_EXPIRE_MINUTES = 90 * 24 * 60  # 90 days


def _set_auth_cookie(response: Response, token: str, remember: bool = False) -> None:
    max_age = _REMEMBER_EXPIRE_MINUTES * 60 if remember else EXPIRE_MINUTES * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    await _create_default_prefs(db, user.id)
    token = create_access_token(str(user.id))
    response = JSONResponse(content={"ok": True})
    _set_auth_cookie(response, token)
    return response


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    expire = _REMEMBER_EXPIRE_MINUTES if body.remember_me else None
    token = create_access_token(str(user.id), expire_minutes=expire)
    response = JSONResponse(content={"ok": True})
    _set_auth_cookie(response, token, remember=body.remember_me)
    return response


@router.post("/logout", status_code=204)
async def logout(response: Response):
    _clear_auth_cookie(response)
    return None


@router.get("/google")
def google_login():
    return RedirectResponse(get_google_auth_url())


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        guser = await exchange_code_for_user(code)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google sign-in failed. Please try again.")

    google_id = guser.get("sub")
    email = guser.get("email")
    name = guser.get("name", email)
    avatar = guser.get("picture")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.google_id = google_id
            user.avatar_url = avatar or user.avatar_url
            await db.commit()
        else:
            user = User(name=name, email=email, google_id=google_id, avatar_url=avatar)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            await _create_default_prefs(db, user.id)

    token = create_access_token(str(user.id))
    redirect = RedirectResponse(f"{FRONTEND_URL}/auth/callback", status_code=302)
    _set_auth_cookie(redirect, token)
    return redirect


@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    return await get_or_404(db, select(User).where(User.id == user_id), "Account not found. Please sign in again.")


@router.patch("/me", response_model=UserResponse)
@limiter.limit("20/minute")
async def update_me(request: Request, body: UserUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found. Please sign in again.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


# ── Change password ──────────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)


@router.post("/change-password", status_code=204)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found. Please sign in again.")
    if not user.password_hash or not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    err = validate_password(body.new_password, user.email)
    if err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err)
    if verify_password(body.new_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="New password must differ from current password.")
    user.password_hash = hash_password(body.new_password)
    await db.commit()


# ── Forgot password (OTP flow) ───────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

class VerifyOtpResponse(BaseModel):
    reset_token: str

class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=8, max_length=72)


def _make_reset_token(email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    return jwt.encode({"sub": email, "purpose": "reset", "exp": expire}, _JWT_SECRET, algorithm=_JWT_ALGO)


def _decode_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGO])
        if payload.get("purpose") != "reset":
            raise ValueError
        return payload["sub"]
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")


@router.post("/forgot-password", status_code=204)
@limiter.limit("3/minute")
async def forgot_password(request: Request, body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if not result.scalar_one_or_none():
        return  # no email enumeration

    await db.execute(delete(PasswordResetOtp).where(PasswordResetOtp.email == body.email))

    code = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.add(PasswordResetOtp(email=body.email, otp=code, expires_at=expires))
    await db.commit()

    queued = await enqueue_send_otp(body.email, code)
    if not queued:
        # Redis unavailable — fire SMTP in a thread so the response is never blocked
        def _send():
            try:
                send_otp_email(body.email, code)
            except Exception as exc:
                import logging
                logging.getLogger("orbit").error("send_otp_email fallback failed: %s", exc, exc_info=True)
        asyncio.get_event_loop().run_in_executor(None, _send)


OTP_MAX_ATTEMPTS = 5
OTP_LOCK_MINUTES = 15


@router.post("/verify-otp", response_model=VerifyOtpResponse)
@limiter.limit("10/minute")
async def verify_otp(request: Request, body: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(PasswordResetOtp)
        .where(PasswordResetOtp.email == body.email)
        .order_by(PasswordResetOtp.created_at.desc())
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code.")

    if record.locked_until:
        locked_until_aware = _as_utc(record.locked_until)
        if locked_until_aware > now:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Try again in 15 minutes.")
        else:
            record.locked_until = None
            record.attempt_count = 0

    if _as_utc(record.expires_at) <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code has expired.")

    if record.otp != body.otp:
        record.attempt_count += 1
        if record.attempt_count >= OTP_MAX_ATTEMPTS:
            record.locked_until = now + timedelta(minutes=OTP_LOCK_MINUTES)
            await db.commit()
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Try again in 15 minutes.")
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code.")

    await db.delete(record)
    await db.commit()
    return VerifyOtpResponse(reset_token=_make_reset_token(body.email))


@router.post("/reset-password", status_code=204)
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    email = _decode_reset_token(body.reset_token)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account not found. Please start over.")

    err = validate_password(body.new_password, email)
    if err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err)

    user.password_hash = hash_password(body.new_password)
    await db.execute(delete(PasswordResetOtp).where(PasswordResetOtp.email == email))
    await db.commit()
