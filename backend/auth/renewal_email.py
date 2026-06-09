import logging
import os
from datetime import datetime

import resend

logger = logging.getLogger("orbit")

FROM_EMAIL = "Remio <onboarding@resend.dev>"


def send_renewal_digest_email(
    to_email: str,
    apps: list[dict],
) -> None:
    """
    Send a single digest email listing all upcoming renewals for a user.

    Each item in `apps` must have:
        name       str
        expires_at datetime (UTC)
        days_left  int
        plan       str  ("trial" or other)
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        logger.error("RESEND_API_KEY is not set — cannot send renewal digest email")
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = api_key

    n = len(apps)
    subject = f"Remio — {n} subscription{'s' if n != 1 else ''} renewing soon"

    # Sort soonest first
    apps_sorted = sorted(apps, key=lambda a: a["days_left"])

    def _row_bg(days_left: int) -> str:
        if days_left <= 1:
            return "#FFF3CD"   # orange-ish
        if days_left <= 3:
            return "#FFF8DC"   # yellow
        return "#ffffff"

    def _days_label(days_left: int, plan: str) -> str:
        verb = "ends" if plan == "trial" else "renews"
        if days_left == 0:
            return f"{verb} today"
        if days_left == 1:
            return f"{verb} tomorrow"
        return f"in {days_left} days"

    rows_html = ""
    for app in apps_sorted:
        bg = _row_bg(app["days_left"])
        expiry_str = app["expires_at"].strftime("%b %d, %Y") if isinstance(app["expires_at"], datetime) else str(app["expires_at"])
        days_label = _days_label(app["days_left"], app.get("plan", ""))
        avatar = app["name"][0].upper() if app["name"] else "A"
        rows_html += f"""
          <tr style="background-color:{bg};">
            <td style="padding:12px 16px;border-bottom:1px solid #e8e8e8;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:32px;height:32px;border-radius:8px;background-color:#6B8F71;line-height:32px;text-align:center;font-size:14px;font-weight:700;color:#ffffff;display:inline-block;">{avatar}</div>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:15px;font-weight:600;color:#1a1a1a;">{app["name"]}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #e8e8e8;font-size:14px;color:#444444;white-space:nowrap;">{expiry_str}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e8e8e8;font-size:14px;color:#444444;white-space:nowrap;">{days_label}</td>
          </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#6B8F71;padding:28px 40px;text-align:center;">
              <span style="font-size:26px;font-weight:700;color:#ffffff;letter-spacing:2px;">REMIO</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;">Upcoming renewals</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#666666;">
                You have {n} subscription{'s' if n != 1 else ''} renewing soon.
              </p>

              <!-- Subscriptions table -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:32px;">
                <!-- Table header -->
                <tr style="background-color:#f7f7f7;">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e8e8e8;">App</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e8e8e8;">Renewal Date</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e8e8e8;">Status</th>
                </tr>
                {rows_html}
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background-color:#6B8F71;border-radius:8px;">
                    <a href="https://remiolauncher.com" target="_blank" style="display:inline-block;padding:14px 36px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">Open Remio</a>
                  </td>
                </tr>
              </table>

              <!-- Secondary text -->
              <p style="margin:0;font-size:13px;color:#888888;line-height:1.6;text-align:center;">
                You're receiving this because you have subscriptions tracked in Remio.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F5F5F5;padding:20px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0 0 6px;font-size:13px;color:#999999;">
                Remio &mdash; <a href="https://remiolauncher.com" style="color:#6B8F71;text-decoration:none;">remiolauncher.com</a>
              </p>
              <p style="margin:0;font-size:12px;color:#bbbbbb;">
                <a href="https://remiolauncher.com" style="color:#bbbbbb;text-decoration:underline;">Manage notifications in Remio settings</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    params: resend.Emails.SendParams = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    try:
        result = resend.Emails.send(params)
        logger.info(
            "Renewal digest email sent to %s (%d apps, id=%s)",
            to_email,
            n,
            result.get("id"),
        )
    except Exception as exc:
        logger.error("Resend renewal digest email failed for %s: %s", to_email, exc, exc_info=True)
        raise
