"""Send push notifications via Firebase Cloud Messaging HTTP v1."""
from __future__ import annotations

import json
import logging
import os

import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request as GoogleAuthRequest

logger = logging.getLogger("orbit.fcm")

_FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "").strip()
_FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()

_credentials = None


def _fcm_configured() -> bool:
    return bool(_FIREBASE_PROJECT_ID and _FIREBASE_CREDENTIALS_JSON)


def _credentials_obj():
    global _credentials
    if _credentials is None:
        info = json.loads(_FIREBASE_CREDENTIALS_JSON)
        _credentials = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/firebase.messaging"],
        )
    return _credentials


def _access_token() -> str | None:
    if not _fcm_configured():
        return None
    try:
        creds = _credentials_obj()
        creds.refresh(GoogleAuthRequest())
        return creds.token
    except Exception:
        logger.exception("FCM credentials refresh failed")
        return None


def send_fcm_notification(fcm_token: str, payload: dict) -> bool:
    """
    Send FCM message. Returns True on success.
    Returns False if token is invalid/unregistered (caller should delete sub).
    Returns True on transient errors (do not delete sub).
    """
    token = _access_token()
    if not token:
        logger.warning("FCM not configured, skipping push")
        return False

    title = payload.get("title", "Remio")
    body = payload.get("body", "")
    url = payload.get("url", "/")

    message = {
        "message": {
            "token": fcm_token,
            "notification": {"title": title, "body": body},
            "data": {
                "url": str(url),
                "title": str(title),
                "body": str(body),
            },
            "android": {"priority": "high"},
        }
    }

    resp = requests.post(
        f"https://fcm.googleapis.com/v1/projects/{_FIREBASE_PROJECT_ID}/messages:send",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=message,
        timeout=15,
    )

    if resp.status_code == 200:
        return True

    try:
        err = resp.json()
        details = err.get("error", {}).get("details", [])
        for d in details:
            if d.get("@type", "").endswith("FcmError"):
                if d.get("errorCode") in ("UNREGISTERED", "INVALID_ARGUMENT"):
                    logger.info("FCM token expired: %s", fcm_token[:24])
                    return False
    except Exception:
        pass

    logger.warning("FCM send failed %s: %s", resp.status_code, resp.text[:200])
    return True
