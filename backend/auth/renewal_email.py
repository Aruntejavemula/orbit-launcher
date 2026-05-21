import logging
import os
from datetime import datetime

import resend

logger = logging.getLogger("orbit")

FROM_EMAIL = "Remio <onboarding@resend.dev>"


def send_renewal_reminder_email(
    to_email: str,
    app_name: str,
    *,
    plan: str,
    expires_at: datetime,
    days_before: int,
) -> None:
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        logger.error("RESEND_API_KEY is not set — cannot send renewal reminder email")
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = api_key

    expiry_str = expires_at.strftime("%B %d, %Y")
    if days_before == 0:
        when = "today"
    elif days_before == 1:
        when = "tomorrow"
    else:
        when = f"in {days_before} days"

    label = "trial ends" if plan == "trial" else "renews"
    subject = f"Reminder: {app_name} {label} {when}"

    html = f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <h2 style="margin:0 0 8px;font-size:22px">Subscription reminder</h2>
  <p style="color:#6b7269;margin:0 0 16px">
    <strong>{app_name}</strong> {label} <strong>{when}</strong>
    ({expiry_str}).
  </p>
  <p style="color:#6b7269;margin:0;font-size:13px">
    Open Remio to review or manage this subscription.
  </p>
</div>
"""

    params: resend.Emails.SendParams = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    try:
        result = resend.Emails.send(params)
        logger.info("Renewal reminder email sent to %s for %s (id=%s)", to_email, app_name, result.get("id"))
    except Exception as exc:
        logger.error("Resend renewal email failed for %s: %s", to_email, exc, exc_info=True)
        raise
