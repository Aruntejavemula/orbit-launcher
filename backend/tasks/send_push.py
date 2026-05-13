import json
import logging
import os
from pywebpush import webpush, WebPushException

logger = logging.getLogger("orbit.push")

_VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
_VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "mailto:support@remiolauncher.com")
_VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")


def send_push_notification(endpoint: str, p256dh: str, auth: str, payload: dict) -> bool:
    """Send a Web Push notification. Returns True on success, False if subscription expired."""
    if not _VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY not set, skipping push")
        return False

    subscription_info = {
        "endpoint": endpoint,
        "keys": {"p256dh": p256dh, "auth": auth},
    }

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload),
            vapid_private_key=_VAPID_PRIVATE_KEY,
            vapid_claims={"sub": _VAPID_SUBJECT},
        )
        return True
    except WebPushException as e:
        if e.response and e.response.status_code in (404, 410):
            logger.info("Push subscription expired: %s", endpoint[:60])
            return False
        logger.warning("Push send failed (transient): %s", e)
        return True  # Don't delete sub on transient errors
