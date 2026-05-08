"""
Tests for the /api/subscriptions router.

All subscription endpoints just log and return 204.
We mock the logger and verify log calls.
"""
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# POST /api/subscriptions/cancel-reason
# ---------------------------------------------------------------------------


class TestCancelReason:
    async def test_logs_reason_and_returns_204(self, client, mock_db):
        """Valid reason is logged and returns 204."""
        with patch("routers.subscriptions.logger") as mock_logger:
            resp = await client.post("/api/subscriptions/cancel-reason", json={
                "reason": "Too expensive for my needs",
            })
            assert resp.status_code == 204
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args
            assert "cancel_reason" in call_args[0][0]
            assert "Too expensive for my needs" in str(call_args)

    @pytest.mark.parametrize("body,expected_status", [
        # Empty reason (min_length=1)
        ({"reason": ""}, 422),
        # Missing reason field
        ({}, 422),
        # Reason too long (>500 chars)
        ({"reason": "x" * 501}, 422),
    ])
    async def test_invalid_body_returns_422(self, client, mock_db, body, expected_status):
        """Table-driven: invalid cancel-reason payloads rejected."""
        resp = await client.post("/api/subscriptions/cancel-reason", json=body)
        assert resp.status_code == expected_status

    async def test_valid_short_reason(self, client, mock_db):
        """Single character reason is valid (min_length=1)."""
        resp = await client.post("/api/subscriptions/cancel-reason", json={
            "reason": "x",
        })
        assert resp.status_code == 204

    async def test_max_length_reason(self, client, mock_db):
        """500-char reason is valid (max_length=500)."""
        resp = await client.post("/api/subscriptions/cancel-reason", json={
            "reason": "a" * 500,
        })
        assert resp.status_code == 204


# ---------------------------------------------------------------------------
# POST /api/subscriptions/claim-offer
# ---------------------------------------------------------------------------


class TestClaimOffer:
    async def test_logs_offer_id_and_returns_204(self, client, mock_db):
        """Valid offer_id is logged and returns 204."""
        with patch("routers.subscriptions.logger") as mock_logger:
            resp = await client.post("/api/subscriptions/claim-offer", json={
                "offer_id": "retention-50-off",
            })
            assert resp.status_code == 204
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args
            assert "offer_claimed" in call_args[0][0]
            assert "retention-50-off" in str(call_args)

    @pytest.mark.parametrize("body,expected_status", [
        # Empty offer_id (min_length=1)
        ({"offer_id": ""}, 422),
        # Missing offer_id field
        ({}, 422),
        # offer_id too long (>100 chars)
        ({"offer_id": "x" * 101}, 422),
    ])
    async def test_invalid_body_returns_422(self, client, mock_db, body, expected_status):
        """Table-driven: invalid claim-offer payloads rejected."""
        resp = await client.post("/api/subscriptions/claim-offer", json=body)
        assert resp.status_code == expected_status


# ---------------------------------------------------------------------------
# POST /api/subscriptions/cancel
# ---------------------------------------------------------------------------


class TestCancelSubscription:
    async def test_returns_204(self, client, mock_db):
        """Cancel endpoint returns 204."""
        resp = await client.post("/api/subscriptions/cancel")
        assert resp.status_code == 204

    async def test_logs_cancellation(self, client, mock_db):
        """Cancel logs the user_id."""
        with patch("routers.subscriptions.logger") as mock_logger:
            resp = await client.post("/api/subscriptions/cancel")
            assert resp.status_code == 204
            mock_logger.info.assert_called_once()
            call_args = mock_logger.info.call_args
            assert "subscription_cancelled" in call_args[0][0]
