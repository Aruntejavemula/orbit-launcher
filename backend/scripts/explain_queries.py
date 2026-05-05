"""
Run before launch: EXPLAIN ANALYZE on the 5 most frequent queries.
Usage: python scripts/explain_queries.py

Requires a real user_id and app_id from your DB.
Set USER_ID and APP_ID env vars, or edit the constants below.
"""
import os
from sqlalchemy import text
from database import engine

USER_ID = os.getenv("EXPLAIN_USER_ID", "00000000-0000-0000-0000-000000000000")
APP_ID  = os.getenv("EXPLAIN_APP_ID",  "00000000-0000-0000-0000-000000000000")

QUERIES = [
    (
        "GET /apps  — list active apps for user",
        """
        EXPLAIN ANALYZE
        SELECT id, name, slug, color, url, category, plan, expires_at,
               manage_url, icon_key, frequency, pending_unsubscribe_at,
               display_order, is_deleted, deleted_at, created_at, updated_at, last_opened_at
        FROM apps
        WHERE user_id = :uid AND is_deleted = false
        ORDER BY display_order
        LIMIT 200
        """,
    ),
    (
        "GET /launches  — last 200 launch events",
        """
        EXPLAIN ANALYZE
        SELECT id, app_id, launched_at
        FROM launch_events
        WHERE user_id = :uid
        ORDER BY launched_at DESC
        LIMIT 200
        """,
    ),
    (
        "GET /insights/usage  — aggregate usage per app",
        """
        EXPLAIN ANALYZE
        SELECT app_id, SUM(duration_minutes) AS total
        FROM usage_sessions
        WHERE user_id = :uid
        GROUP BY app_id
        """,
    ),
    (
        "GET /insights/renewals  — apps expiring in 30 days",
        """
        EXPLAIN ANALYZE
        SELECT id, name, slug, expires_at
        FROM apps
        WHERE user_id = :uid
          AND expires_at IS NOT NULL
          AND expires_at <= NOW() + INTERVAL '30 days'
          AND is_deleted = false
        ORDER BY expires_at
        """,
    ),
    (
        "POST /apps/{id}/launch  — lookup single app",
        """
        EXPLAIN ANALYZE
        SELECT id, name, slug, url
        FROM apps
        WHERE user_id = :uid AND id = :aid AND is_deleted = false
        LIMIT 1
        """,
    ),
]


def main():
    with engine.connect() as conn:
        for label, sql in QUERIES:
            print(f"\n{'='*60}")
            print(f"  {label}")
            print('='*60)
            result = conn.execute(text(sql), {"uid": USER_ID, "aid": APP_ID})
            for row in result:
                print(row[0])


if __name__ == "__main__":
    main()
