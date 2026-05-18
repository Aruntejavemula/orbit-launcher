from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, EmailStr, Field
from jose import JWTError, jwt
from database import get_db
from models import User, Preferences
from models.otp import PasswordResetOtp
from schemas.auth import RegisterRequest, LoginRequest, UserResponse, UserUpdate, RememberDeviceRequest
from auth.password import hash_password, verify_password
from auth.password_policy import validate_password
from auth.jwt import COOKIE_NAME, EXPIRE_MINUTES, SECRET as _JWT_SECRET, ALGORITHM as _JWT_ALGO, create_access_token, get_current_user_id
from auth.google import OAuthPlatform, get_google_auth_url, exchange_code_for_user, google_oauth_configured
from auth.email_otp import generate_otp, send_otp_email
from job_queue import enqueue_send_otp
from limiter import limiter
from utils import get_or_404, as_utc, apply_partial_update
from dotenv import load_dotenv
import os
import logging
import asyncio
import hmac
import hashlib
import time
import secrets
import uuid
from datetime import datetime, timedelta, timezone

load_dotenv()

logger = logging.getLogger("orbit.auth")

router = APIRouter()
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")

_IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"
_GOOGLE_STATE_COOKIE = "orbit_google_state"


def _create_oauth_state(*, desktop: bool = False, remio: bool = False, remember: bool = False) -> str:
    ts = str(int(time.time()))
    if remio:
        mode = "r"
    elif desktop:
        mode = "d"
    else:
        mode = "w"
    rem = "1" if remember else "0"
    sig = hmac.new(_JWT_SECRET.encode(), f"{ts}:{mode}:{rem}".encode(), hashlib.sha256).hexdigest()[:16]
    return f"{ts}.{sig}.{mode}.{rem}"


def _parse_oauth_state(state: str, max_age: int = 300) -> tuple[bool, bool, bool, bool]:
    """Returns (valid, use_desktop_credentials, remio_handoff, remember_device)."""
    try:
        parts = state.split(".")
        if len(parts) == 2:
            ts, sig = parts
            expected = hmac.new(_JWT_SECRET.encode(), ts.encode(), hashlib.sha256).hexdigest()[:16]
            if not hmac.compare_digest(sig, expected):
                return False, False, False, False
            if (int(time.time()) - int(ts)) > max_age:
                return False, False, False, False
            return True, False, False, False
        if len(parts) == 3:
            ts, sig, mode = parts
            if mode not in ("w", "d", "r"):
                return False, False, False, False
            expected = hmac.new(_JWT_SECRET.encode(), f"{ts}:{mode}".encode(), hashlib.sha256).hexdigest()[:16]
            if not hmac.compare_digest(sig, expected):
                return False, False, False, False
            if (int(time.time()) - int(ts)) > max_age:
                return False, False, False, False
            return True, mode in ("d", "r"), mode == "r", False
        if len(parts) == 4:
            ts, sig, mode, rem = parts
            if mode not in ("w", "d", "r") or rem not in ("0", "1"):
                return False, False, False, False
            expected = hmac.new(_JWT_SECRET.encode(), f"{ts}:{mode}:{rem}".encode(), hashlib.sha256).hexdigest()[:16]
            if not hmac.compare_digest(sig, expected):
                return False, False, False, False
            if (int(time.time()) - int(ts)) > max_age:
                return False, False, False, False
            return True, mode in ("d", "r"), mode == "r", rem == "1"
        return False, False, False, False
    except Exception:
        return False, False, False, False


def _verify_oauth_state(state: str, max_age: int = 300) -> tuple[bool, bool]:
    valid, desktop_creds, _remio, _remember = _parse_oauth_state(state, max_age)
    return valid, desktop_creds


def _oauth_state_valid(request: Request, state: str | None) -> tuple[bool, OAuthPlatform, bool, bool]:
    if state:
        valid, desktop_creds, remio, remember = _parse_oauth_state(state)
        if valid:
            cookie = request.cookies.get(_GOOGLE_STATE_COOKIE)
            if not cookie or cookie == state:
                platform: OAuthPlatform = "desktop" if desktop_creds else "web"
                return True, platform, remio, remember
    cookie = request.cookies.get(_GOOGLE_STATE_COOKIE)
    if state and cookie and state == cookie:
        return True, "web", False, False
    return False, "web", False, False


def _create_desktop_exchange_code(user_id: str, *, remember: bool = False) -> str:
    expire = datetime.now(timezone.utc) + timedelta(seconds=90)
    return jwt.encode(
        {"sub": user_id, "purpose": "desktop_oauth", "remember": remember, "exp": expire},
        _JWT_SECRET,
        algorithm=_JWT_ALGO,
    )


def _consume_desktop_exchange_code(code: str) -> tuple[str, bool]:
    try:
        payload = jwt.decode(code, _JWT_SECRET, algorithms=[_JWT_ALGO])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired sign-in code.")
    if payload.get("purpose") != "desktop_oauth":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired sign-in code.")
    return str(payload["sub"]), bool(payload.get("remember"))


async def _create_default_prefs(db: AsyncSession, user_id: uuid.UUID):
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    if result.scalar_one_or_none():
        return
    prefs = Preferences(user_id=user_id)
    db.add(prefs)
    await db.flush()


_REMEMBER_EXPIRE_MINUTES = 90 * 24 * 60  # 90 days


def _set_auth_cookie(response: Response, token: str, remember: bool = False) -> None:
    max_age = _REMEMBER_EXPIRE_MINUTES * 60 if remember else EXPIRE_MINUTES * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_IS_PROD,
        # lax: required for Google OAuth (top-level redirect back from accounts.google.com)
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        secure=_IS_PROD,
        samesite="lax",
    )


@router.post("/register", status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not create account. Please try again or sign in.")
    err = validate_password(body.password, body.email)
    if err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=err)
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()
    await _create_default_prefs(db, user.id)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(str(user.id), token_version=user.token_version)
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
    token = create_access_token(
        str(user.id),
        token_version=user.token_version,
        expire_minutes=expire,
        remember=body.remember_me,
    )
    response = JSONResponse(content={"ok": True})
    _set_auth_cookie(response, token, remember=body.remember_me)
    return response


@router.post("/remember-device")
@limiter.limit("10/minute")
async def set_remember_device(
    request: Request,
    body: RememberDeviceRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found.")
    expire = _REMEMBER_EXPIRE_MINUTES if body.remember_device else None
    token = create_access_token(
        str(user.id),
        token_version=user.token_version,
        expire_minutes=expire,
        remember=body.remember_device,
    )
    response = JSONResponse({"remember_device": body.remember_device})
    _set_auth_cookie(response, token, remember=body.remember_device)
    return response


@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found.")
    user.token_version += 1
    await db.commit()
    _clear_auth_cookie(response)
    return None


@router.get("/google")
def google_login(desktop: bool = False, platform: str | None = None, remember: bool = False):
    use_desktop_creds = desktop or (platform or "").lower() == "desktop"
    oauth_platform: OAuthPlatform = "desktop" if use_desktop_creds else "web"
    if not google_oauth_configured(oauth_platform):
        if oauth_platform == "desktop":
            detail = (
                "Desktop Google sign-in is not configured. "
                "Set GOOGLE_CLIENT_ID_DESKTOP and GOOGLE_CLIENT_SECRET_DESKTOP on the server."
            )
        else:
            detail = "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server."
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
    state = _create_oauth_state(desktop=use_desktop_creds, remio=desktop, remember=remember)
    redirect = RedirectResponse(get_google_auth_url(state, platform=oauth_platform))
    redirect.set_cookie(
        key=_GOOGLE_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=_IS_PROD,
        samesite="lax",
        max_age=300,
        path="/api/auth",
    )
    return redirect


@router.get("/google/callback")
async def google_callback(request: Request, code: str, state: str | None = None, db: AsyncSession = Depends(get_db)):
    valid, oauth_platform, remio_handoff, remember_device = _oauth_state_valid(request, state)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OAuth state.")

    try:
        guser = await exchange_code_for_user(code, platform=oauth_platform)
    except Exception as exc:
        logger.warning("Google OAuth exchange failed: %s", exc)
        if _IS_PROD:
            return RedirectResponse(f"{FRONTEND_URL}/?google_error=1", status_code=302)
        detail = "Google sign-in failed. Please try again."
        if str(exc):
            detail = f"Google sign-in failed: {exc}"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

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
            await db.flush()
            await _create_default_prefs(db, user.id)
            await db.commit()
            await db.refresh(user)

    expire = _REMEMBER_EXPIRE_MINUTES if remember_device else None
    token = create_access_token(
        str(user.id),
        token_version=user.token_version,
        expire_minutes=expire,
        remember=remember_device,
    )
    if remio_handoff:
        exchange = _create_desktop_exchange_code(str(user.id), remember=remember_device)
        return RedirectResponse(f"remio://auth/callback?code={exchange}", status_code=302)

    redirect = RedirectResponse(f"{FRONTEND_URL.rstrip('/')}/auth/callback", status_code=302)
    redirect.delete_cookie(key=_GOOGLE_STATE_COOKIE, path="/api/auth", secure=_IS_PROD, samesite="lax")
    _set_auth_cookie(redirect, token, remember=remember_device)
    return redirect


class DesktopSessionRequest(BaseModel):
    code: str = Field(min_length=10, max_length=2048)


@router.post("/desktop/session")
async def desktop_session(body: DesktopSessionRequest, db: AsyncSession = Depends(get_db)):
    user_id, remember_device = _consume_desktop_exchange_code(body.code)
    user = await get_or_404(
        db,
        select(User).where(User.id == user_id),
        "Account not found. Please sign in again.",
    )
    expire = _REMEMBER_EXPIRE_MINUTES if remember_device else None
    token = create_access_token(
        str(user.id),
        token_version=user.token_version,
        expire_minutes=expire,
        remember=remember_device,
    )
    response = JSONResponse({"ok": True})
    _set_auth_cookie(response, token, remember=remember_device)
    return response


@router.get("/me", response_model=UserResponse)
async def me(request: Request, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found. Please sign in again.")
    token_tv = getattr(request.state, "token_version", 0)
    if user.token_version != token_tv:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")
    base = UserResponse.model_validate(user)
    return base.model_copy(update={"remember_device": getattr(request.state, "remember_device", False)})


@router.patch("/me", response_model=UserResponse)
@limiter.limit("20/minute")
async def update_me(request: Request, body: UserUpdate, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_or_404(db, select(User).where(User.id == user_id), "Account not found. Please sign in again.")
    if body.email and body.email != user.email:
        existing = await db.execute(select(User).where(User.email == body.email, User.id != user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="That email is already in use.")

    apply_partial_update(user, body.model_dump(exclude_unset=True))
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
    user.token_version += 1
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

    recent_cutoff = datetime.now(timezone.utc) - timedelta(seconds=60)
    recent = await db.execute(
        select(PasswordResetOtp).where(
            PasswordResetOtp.email == body.email,
            PasswordResetOtp.created_at > recent_cutoff,
        )
    )
    if recent.scalar_one_or_none():
        return  # silent per-email cooldown; still 204 to avoid enumeration

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
        locked_until_aware = as_utc(record.locked_until)
        if locked_until_aware > now:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Try again in 15 minutes.")
        else:
            record.locked_until = None
            record.attempt_count = 0

    if as_utc(record.expires_at) <= now:
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
    user.token_version += 1
    await db.execute(delete(PasswordResetOtp).where(PasswordResetOtp.email == email))
    await db.commit()
