import pytest
from unittest.mock import patch, MagicMock
import os

from auth.email_otp import generate_otp, send_otp_email


class TestGenerateOtp:
    def test_returns_6_digit_string(self):
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()

    def test_minimum_value(self):
        # Should never be less than 100000
        for _ in range(100):
            otp = generate_otp()
            assert int(otp) >= 100000

    def test_maximum_value(self):
        # Should never exceed 999999
        for _ in range(100):
            otp = generate_otp()
            assert int(otp) <= 999999

    def test_generates_different_values(self):
        otps = {generate_otp() for _ in range(50)}
        # With 50 samples from 900k range, collisions extremely unlikely
        assert len(otps) > 40


class TestSendOtpEmail:
    def test_raises_without_api_key(self):
        with patch.dict(os.environ, {"RESEND_API_KEY": ""}, clear=False):
            with pytest.raises(RuntimeError, match="RESEND_API_KEY"):
                send_otp_email("test@example.com", "123456")

    @patch("auth.email_otp.resend")
    def test_sends_email_with_correct_params(self, mock_resend):
        with patch.dict(os.environ, {"RESEND_API_KEY": "re_test_key"}, clear=False):
            mock_resend.Emails.send.return_value = {"id": "email-123"}
            send_otp_email("test@example.com", "654321")

            mock_resend.Emails.send.assert_called_once()
            call_args = mock_resend.Emails.send.call_args[0][0]
            assert call_args["to"] == ["test@example.com"]
            assert "654321" in call_args["html"]
            assert call_args["subject"] == "Your OTP Code"

    @patch("auth.email_otp.resend")
    def test_raises_on_send_failure(self, mock_resend):
        with patch.dict(os.environ, {"RESEND_API_KEY": "re_test_key"}, clear=False):
            mock_resend.Emails.send.side_effect = Exception("API error")
            with pytest.raises(Exception, match="API error"):
                send_otp_email("test@example.com", "123456")
