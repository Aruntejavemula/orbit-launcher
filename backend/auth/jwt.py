from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Cookie, HTTPException, Request, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os

load_dotenv()

SECRET = os.getenv("JWT_SECRET")
if not SECRET:
    raise RuntimeError("JWT_SECRET environment variable must be set")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
COOKIE_NAME = "orbit_session"

bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, token_version: int = 0, expire_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes or EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "tv": token_version, "exp": expire}, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")
        return {"user_id": user_id, "token_version": payload.get("tv", 0)}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")


def get_current_user_id(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    token = request.cookies.get(COOKIE_NAME)
    if not token and bearer:
        token = bearer.credentials
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.")
    claims = decode_token(token)
    request.state.user_id = claims["user_id"]
    request.state.token_version = claims["token_version"]
    return claims["user_id"]
