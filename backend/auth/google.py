import httpx
import logging
from dataclasses import dataclass
from typing import Literal
from urllib.parse import urlencode
from dotenv import load_dotenv
import os

load_dotenv()

logger = logging.getLogger("orbit.google")

OAuthPlatform = Literal["web", "desktop"]

_default_frontend = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
_web_redirect_uri = (
    os.getenv("GOOGLE_REDIRECT_URI") or f"{_default_frontend}/api/auth/google/callback"
).strip()
_desktop_redirect_uri = (os.getenv("GOOGLE_REDIRECT_URI_DESKTOP") or _web_redirect_uri).strip()

_WEB = {
    "client_id": (os.getenv("GOOGLE_CLIENT_ID") or "").strip(),
    "client_secret": (os.getenv("GOOGLE_CLIENT_SECRET") or "").strip(),
    "redirect_uri": _web_redirect_uri,
}
_DESKTOP = {
    "client_id": (os.getenv("GOOGLE_CLIENT_ID_DESKTOP") or "").strip(),
    "client_secret": (os.getenv("GOOGLE_CLIENT_SECRET_DESKTOP") or "").strip(),
    "redirect_uri": _desktop_redirect_uri,
}

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@dataclass(frozen=True)
class GoogleOAuthConfig:
    client_id: str
    client_secret: str
    redirect_uri: str


def get_google_oauth_config(platform: OAuthPlatform = "web") -> GoogleOAuthConfig:
    cfg = _DESKTOP if platform == "desktop" else _WEB
    return GoogleOAuthConfig(
        client_id=cfg["client_id"],
        client_secret=cfg["client_secret"],
        redirect_uri=cfg["redirect_uri"],
    )


def google_oauth_configured(platform: OAuthPlatform = "web") -> bool:
    cfg = get_google_oauth_config(platform)
    return bool(cfg.client_id and cfg.client_secret)


def get_google_auth_url(state: str, platform: OAuthPlatform = "web") -> str:
    cfg = get_google_oauth_config(platform)
    if not cfg.client_id or not cfg.client_secret:
        label = (
            "GOOGLE_CLIENT_ID_DESKTOP and GOOGLE_CLIENT_SECRET_DESKTOP"
            if platform == "desktop"
            else "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
        )
        raise ValueError(f"{label} must be set in the environment.")
    params = {
        "client_id": cfg.client_id,
        "redirect_uri": cfg.redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
    }
    if platform == "desktop":
        params["prompt"] = "select_account"
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_user(code: str, platform: OAuthPlatform = "web") -> dict:
    cfg = get_google_oauth_config(platform)
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": cfg.client_id,
                "client_secret": cfg.client_secret,
                "redirect_uri": cfg.redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        try:
            token_resp.raise_for_status()
        except httpx.HTTPStatusError:
            logger.warning(
                "Google token exchange failed platform=%s redirect_uri=%s response=%s",
                platform,
                cfg.redirect_uri,
                token_resp.text[:500],
            )
            try:
                err_body = token_resp.json()
                desc = err_body.get("error_description") or err_body.get("error") or token_resp.text
            except Exception:
                desc = token_resp.text[:200]
            raise ValueError(desc) from None
        access_token = token_resp.json()["access_token"]

        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_resp.raise_for_status()
        return user_resp.json()
