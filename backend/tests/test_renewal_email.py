from unittest.mock import patch
import os
from datetime import datetime, timezone

import pytest

from auth.renewal_email import send_renewal_reminder_email


class TestRenewalEmail:
    @patch("auth.renewal_email.resend")
    def test_sends_with_app_details(self, mock_resend):
        with patch.dict(os.environ, {"RESEND_API_KEY": "re_test"}):
            mock_resend.Emails.send.return_value = {"id": "x"}
            send_renewal_reminder_email(
                "user@example.com",
                "Spotify",
                plan="paid",
                expires_at=datetime(2026, 3, 15, tzinfo=timezone.utc),
                days_before=3,
            )
            args = mock_resend.Emails.send.call_args[0][0]
            assert args["to"] == ["user@example.com"]
            assert "Spotify" in args["html"]
            assert "in 3 days" in args["subject"]
