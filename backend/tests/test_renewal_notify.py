"""Unit coverage for tasks.renewal_notify helpers."""
from datetime import date, datetime, timezone
from types import SimpleNamespace

from tasks import renewal_notify as rn


class TestRenewalNotifyHelpers:
    def test_days_until_expiry(self):
        exp = datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc)
        assert rn.days_until_expiry(exp, date(2026, 5, 28)) == 4
        assert rn.expiry_date_utc(exp) == date(2026, 6, 1)

    def test_add_pending_dedupes_same_key(self):
        pending: list[rn.PendingDelivery] = []
        seen: set[tuple] = set()
        user = SimpleNamespace(id="u1")
        app = SimpleNamespace(id="a1", name="App")
        rn._add_pending(pending, seen, user=user, app=app, days_before=3, channel="email")
        rn._add_pending(pending, seen, user=user, app=app, days_before=3, channel="email")
        assert len(pending) == 1

    def test_push_payload_copy_for_trial_paid_and_plain_plan(self):
        trial = SimpleNamespace(name="TrialApp", plan=SimpleNamespace(value="trial"))
        assert "trial ends today" in rn._push_payload(trial, 0)["title"]
        paid = SimpleNamespace(name="PaidApp", plan=SimpleNamespace(value="paid"))
        assert "renews tomorrow" in rn._push_payload(paid, 1)["title"]
        plain = SimpleNamespace(name="PlainApp", plan="paid")
        assert "in 5 days" in rn._push_payload(plain, 5)["title"]
