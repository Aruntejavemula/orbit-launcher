import os
import secrets
import logging
import resend

logger = logging.getLogger("orbit")

FROM_EMAIL = "Remio <onboarding@resend.dev>"


def generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def send_otp_email(to_email: str, otp: str) -> None:
    # Read key at call time so load_dotenv() in main.py has already run
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key:
        logger.error("RESEND_API_KEY is not set — cannot send OTP email")
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = api_key

    params: resend.Emails.SendParams = {
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": "Your OTP Code",
        "html": f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
  <h2 style="margin:0 0 8px;font-size:22px">Reset your password</h2>
  <p style="color:#6b7269;margin:0 0 24px">
    Use the code below to reset your Remio password.
    It expires in <strong>10 minutes</strong>.
  </p>
  <div style="background:#f7f4ee;border-radius:12px;padding:24px;text-align:center;
              letter-spacing:12px;font-size:36px;font-weight:700;color:#1f2421">
    {otp}
  </div>
  <p style="color:#6b7269;margin:24px 0 0;font-size:13px">
    If you didn't request this, you can safely ignore this email.
  </p>
</div>
""",
    }

    try:
        result = resend.Emails.send(params)
        logger.info("OTP email sent to %s (id=%s)", to_email, result.get("id"))
    except Exception as exc:
        logger.error("Resend error sending to %s: %s", to_email, exc, exc_info=True)
        raise
