"""
Integration tests for renewal email/push notification cron logic.
"""
from datetime import date, datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from sqlalchemy import select

from models.reminder_log import ReminderLog
from models.push_subscription import PushSubscription
from models.reminder import ReminderMethodEnum
from tasks import renewal_notify as rn
from tasks.renewal_notify import collect_pending_deliveries, run_renewal_notifications, days_until_expiry
from tests.integration.conftest import seed_user, seed_app, seed_preferences, seed_reminder


class TestCollectPending:
    async def test_empty_when_no_expiring_apps(self, db_session):
        user = await seed_user(db_session, email="renew-empty@example.com")
        await seed_preferences(db_session, user.id)
        await seed_app(db_session, user.id)
        await db_session.commit()
        assert await collect_pending_deliveries(db_session, date.today()) == []

    async def test_skips_already_expired_apps(self, db_session):
        user = await seed_user(db_session, email="renew-past@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        app = await seed_app(db_session, user.id, plan="paid")
        app.expires_at = datetime.now(timezone.utc) - timedelta(days=2)
        await db_session.commit()
        pending = await collect_pending_deliveries(db_session, date.today())
        assert not any(p.app.id == app.id for p in pending)

    async def test_default_automated_push_channel(self, db_session):
        user = await seed_user(db_session, email="renew-push@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = False
        prefs.reminder_push = True
        app = await seed_app(db_session, user.id, plan="paid")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        await db_session.commit()
        pending = await collect_pending_deliveries(db_session, date.today())
        assert any(p.app.id == app.id and p.channel == "push" and p.days_before == 1 for p in pending)

    async def test_per_app_email_reminder(self, db_session):
        user = await seed_user(db_session, email="renew1@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        prefs.reminder_push = False
        app = await seed_app(db_session, user.id, name="Spotify", slug="spotify", plan="paid")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=3)
        days = days_until_expiry(app.expires_at, date.today())
        await seed_reminder(db_session, user.id, app.id, remind_days_before=days, method="email")
        await db_session.commit()

        pending = await collect_pending_deliveries(db_session, date.today())
        assert any(p.app.id == app.id and p.channel == "email" for p in pending)

    async def test_default_automated_at_3_and_1_days(self, db_session):
        user = await seed_user(db_session, email="renew2@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        prefs.reminder_push = False
        app3 = await seed_app(db_session, user.id, name="Three", slug="three", plan="trial")
        app3.expires_at = datetime.now(timezone.utc) + timedelta(days=3)
        app1 = await seed_app(db_session, user.id, name="One", slug="one", plan="paid")
        app1.expires_at = datetime.now(timezone.utc) + timedelta(days=1)
        app7 = await seed_app(db_session, user.id, name="Seven", slug="seven", plan="paid")
        app7.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db_session.commit()

        pending = await collect_pending_deliveries(db_session, date.today())
        assert any(p.app.id == app3.id and p.days_before == 3 for p in pending)
        assert any(p.app.id == app1.id and p.days_before == 1 for p in pending)
        assert not any(p.app.id == app7.id for p in pending)

    async def test_per_app_overrides_default_offset(self, db_session):
        user = await seed_user(db_session, email="renew2b@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        app = await seed_app(db_session, user.id, plan="paid")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=14)
        await seed_reminder(db_session, user.id, app.id, remind_days_before=14, method="email")
        await db_session.commit()

        pending = await collect_pending_deliveries(db_session, date.today())
        assert any(p.app.id == app.id and p.days_before == 14 for p in pending)


class TestRunRenewalNotifications:
    @patch("tasks.renewal_notify.send_renewal_reminder_email")
    @patch("tasks.renewal_notify.send_fcm_notification", return_value=True)
    @patch("tasks.renewal_notify.send_push_notification", return_value=True)
    async def test_sends_and_dedups(self, mock_web_push, mock_fcm, mock_email, db_session):
        user = await seed_user(db_session, email="renew3@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        prefs.reminder_push = True
        app = await seed_app(db_session, user.id, plan="paid")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        days = days_until_expiry(app.expires_at, date.today())
        await seed_reminder(db_session, user.id, app.id, remind_days_before=days, method="email")
        db_session.add(
            PushSubscription(
                user_id=user.id,
                platform="android",
                fcm_token="fcm-integration-test-token",
            )
        )
        await db_session.commit()

        today = date.today()
        with patch.dict("os.environ", {"VAPID_PRIVATE_KEY": "test-private"}):
            sent = await run_renewal_notifications(db_session, today)
        assert sent >= 1
        mock_email.assert_called()

        sent_again = await run_renewal_notifications(db_session, today)
        assert sent_again == 0

        logs = (await db_session.execute(select(ReminderLog))).scalars().all()
        assert len(logs) >= 1


class TestDeliverOne:
    @patch("tasks.renewal_notify.send_push_notification", return_value=True)
    async def test_deliver_push_success(self, _mock_push, db_session):
        user = await seed_user(db_session, email="renew-deliver-push@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_push = True
        app = await seed_app(db_session, user.id, plan="trial")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=3)
        db_session.add(
            PushSubscription(
                user_id=user.id,
                endpoint="https://push.example/sub/1",
                p256dh="k",
                auth="a",
            )
        )
        await db_session.commit()
        today = date.today()
        pending = await collect_pending_deliveries(db_session, today)
        item = next(p for p in pending if p.channel == "push")
        assert await rn.deliver_one(db_session, item, today) is True
        logs = (await db_session.execute(select(ReminderLog))).scalars().all()
        assert any(l.channel == "push" for l in logs)

    @patch("tasks.renewal_notify.send_renewal_reminder_email", side_effect=RuntimeError("smtp down"))
    async def test_deliver_email_failure_returns_false(self, _mock_email, db_session):
        user = await seed_user(db_session, email="renew-deliver-fail@example.com")
        prefs = await seed_preferences(db_session, user.id)
        prefs.reminder_email = True
        app = await seed_app(db_session, user.id, plan="paid")
        app.expires_at = datetime.now(timezone.utc) + timedelta(days=3)
        await db_session.commit()
        today = date.today()
        pending = await collect_pending_deliveries(db_session, today)
        item = next(p for p in pending if p.channel == "email")
        assert await rn.deliver_one(db_session, item, today) is False

    @patch("tasks.renewal_notify.send_push_notification", return_value=False)
    async def test_send_push_prunes_expired_subscription(self, _mock_push, db_session):
        user = await seed_user(db_session, email="renew-prune@example.com")
        app = await seed_app(db_session, user.id, name="PushApp", plan="paid")
        endpoint = "https://push.example/expired"
        db_session.add(
            PushSubscription(user_id=user.id, endpoint=endpoint, p256dh="k", auth="a")
        )
        await db_session.commit()
        assert await rn._send_push(db_session, user.id, app, 1) is False
        left = (
            await db_session.execute(
                select(PushSubscription).where(PushSubscription.endpoint == endpoint)
            )
        ).scalar_one_or_none()
        assert left is None
