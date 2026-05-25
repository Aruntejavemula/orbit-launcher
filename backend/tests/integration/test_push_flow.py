"""
Integration tests for the /api/push router.

Covers: vapid-key endpoint, subscribe, re-subscribe (upsert), unsubscribe.
"""
import os
import pytest
from sqlalchemy import select

from models.push_subscription import PushSubscription
from tests.integration.conftest import seed_user, make_auth_cookie

_SUB_PAYLOAD = {
    "platform": "web",
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
    "p256dh": "test-p256dh-key-value",
    "auth": "test-auth-value",
}


class TestVapidKey:
    async def test_returns_vapid_key_when_configured(self, int_client, db_session):
        import routers.push as push_module
        original = push_module._VAPID_PUBLIC_KEY
        push_module._VAPID_PUBLIC_KEY = "test-vapid-key"

        resp = await int_client.get("/api/push/vapid-key")

        push_module._VAPID_PUBLIC_KEY = original
        assert resp.status_code == 200
        assert resp.json()["public_key"] == "test-vapid-key"

    async def test_returns_503_when_not_configured(self, int_client, db_session):
        import routers.push as push_module
        original = push_module._VAPID_PUBLIC_KEY
        push_module._VAPID_PUBLIC_KEY = ""

        resp = await int_client.get("/api/push/vapid-key")

        push_module._VAPID_PUBLIC_KEY = original
        assert resp.status_code == 503


class TestSubscribe:
    async def test_subscribe_creates_record(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/push/subscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 201

        sub = (await db_session.execute(
            select(PushSubscription).where(PushSubscription.user_id == user.id)
        )).scalar_one_or_none()
        assert sub is not None
        assert sub.platform == "web"
        assert sub.endpoint == _SUB_PAYLOAD["endpoint"]

    async def test_resubscribe_upserts_keys(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post(
            "/api/push/subscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user.id),
        )

        updated_payload = {**_SUB_PAYLOAD, "p256dh": "new-p256dh", "auth": "new-auth"}
        resp = await int_client.post(
            "/api/push/subscribe",
            json=updated_payload,
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 201

        subs = (await db_session.execute(
            select(PushSubscription).where(PushSubscription.user_id == user.id)
        )).scalars().all()
        assert len(subs) == 1
        assert subs[0].p256dh == "new-p256dh"

    async def test_unauthorized_returns_401(self, int_client, db_session):
        resp = await int_client.post("/api/push/subscribe", json=_SUB_PAYLOAD)
        assert resp.status_code == 401

    @pytest.mark.parametrize("field", ["p256dh", "auth"])
    async def test_missing_field_returns_422(self, int_client, db_session, field):
        user = await seed_user(db_session)
        await db_session.commit()

        payload = {k: v for k, v in _SUB_PAYLOAD.items() if k != field}
        resp = await int_client.post(
            "/api/push/subscribe",
            json=payload,
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 422


class TestAndroidSubscribe:
    async def test_android_subscribe_creates_record(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/push/subscribe",
            json={"platform": "android", "fcm_token": "fcm-test-token-abc123"},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 201

        sub = (
            await db_session.execute(
                select(PushSubscription).where(PushSubscription.user_id == user.id)
            )
        ).scalar_one()
        assert sub.platform == "android"
        assert sub.fcm_token == "fcm-test-token-abc123"
        assert sub.endpoint is None

    async def test_android_unsubscribe_removes_record(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        token = "fcm-unsub-token"
        await int_client.post(
            "/api/push/subscribe",
            json={"platform": "android", "fcm_token": token},
            cookies=make_auth_cookie(user.id),
        )

        resp = await int_client.request(
            "DELETE",
            "/api/push/unsubscribe",
            json={"platform": "android", "fcm_token": token},
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

        sub = (
            await db_session.execute(
                select(PushSubscription).where(PushSubscription.user_id == user.id)
            )
        ).scalar_one_or_none()
        assert sub is None


class TestUnsubscribe:
    async def test_unsubscribe_removes_record(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post(
            "/api/push/subscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user.id),
        )

        resp = await int_client.request(
            "DELETE",
            "/api/push/unsubscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

        sub = (await db_session.execute(
            select(PushSubscription).where(PushSubscription.user_id == user.id)
        )).scalar_one_or_none()
        assert sub is None

    async def test_unsubscribe_nonexistent_is_noop(self, int_client, db_session):
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.request(
            "DELETE",
            "/api/push/unsubscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 204

    async def test_only_removes_own_subscription(self, int_client, db_session):
        user1 = await seed_user(db_session, email="u1@example.com")
        user2 = await seed_user(db_session, email="u2@example.com")
        await db_session.commit()

        await int_client.post(
            "/api/push/subscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user1.id),
        )

        # user2 tries to unsubscribe with same endpoint — shouldn't affect user1's sub
        await int_client.request(
            "DELETE",
            "/api/push/unsubscribe",
            json=_SUB_PAYLOAD,
            cookies=make_auth_cookie(user2.id),
        )

        sub = (await db_session.execute(
            select(PushSubscription).where(PushSubscription.user_id == user1.id)
        )).scalar_one_or_none()
        assert sub is not None


class TestPushTestEndpoint:
    async def test_disabled_returns_503(self, int_client, db_session, monkeypatch):
        monkeypatch.delenv("ALLOW_TEST_PUSH", raising=False)
        monkeypatch.delenv("allow_test_push", raising=False)
        user = await seed_user(db_session)
        await db_session.commit()

        resp = await int_client.post(
            "/api/push/test",
            cookies=make_auth_cookie(user.id),
        )
        assert resp.status_code == 503
        assert "ALLOW_TEST_PUSH" in resp.json()["detail"]

    async def test_sends_when_enabled(self, int_client, db_session, monkeypatch):
        from unittest.mock import patch

        monkeypatch.setenv("ALLOW_TEST_PUSH", "1")
        user = await seed_user(db_session)
        await db_session.commit()

        await int_client.post(
            "/api/push/subscribe",
            json={"platform": "android", "fcm_token": "fcm-test-push"},
            cookies=make_auth_cookie(user.id),
        )

        with patch("routers.push.send_fcm_notification", return_value=True):
            resp = await int_client.post(
                "/api/push/test",
                cookies=make_auth_cookie(user.id),
            )

        assert resp.status_code == 200
        assert resp.json()["sent"] == 1
