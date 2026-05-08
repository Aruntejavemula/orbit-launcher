"""
Tests for the /api/catalog router.

The catalog is a static list of app entries. No auth required.
"""
import pytest


class TestGetCatalog:
    async def test_returns_list_of_catalog_entries(self, client, mock_db):
        """GET /api/catalog returns a non-empty list."""
        resp = await client.get("/api/catalog")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_each_entry_has_required_fields(self, client, mock_db):
        """Each catalog entry has name, slug, color, category, url."""
        resp = await client.get("/api/catalog")
        assert resp.status_code == 200
        data = resp.json()

        required_fields = {"name", "slug", "color", "category", "url"}
        for entry in data:
            assert required_fields.issubset(entry.keys()), (
                f"Entry missing fields: {required_fields - set(entry.keys())}"
            )

    async def test_no_auth_required(self, test_app, mock_db):
        """Catalog endpoint works without auth (no dependency override needed)."""
        from httpx import ASGITransport, AsyncClient
        from database import get_db
        from auth.jwt import get_current_user_id

        # Remove auth override to prove it's not needed
        test_app.dependency_overrides.pop(get_current_user_id, None)

        async def override_get_db():
            yield mock_db

        test_app.dependency_overrides[get_db] = override_get_db

        transport = ASGITransport(app=test_app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
            resp = await ac.get("/api/catalog")
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)

    async def test_entries_have_valid_colors(self, client, mock_db):
        """All color values are 6-char hex strings."""
        import re
        resp = await client.get("/api/catalog")
        data = resp.json()

        hex_pattern = re.compile(r"^[0-9A-Fa-f]{6}$")
        for entry in data:
            assert hex_pattern.match(entry["color"]), (
                f"Invalid color '{entry['color']}' for {entry['name']}"
            )

    async def test_entries_have_valid_categories(self, client, mock_db):
        """All categories are from the known set."""
        valid_categories = {"ai", "design", "productivity", "finance", "music"}

        resp = await client.get("/api/catalog")
        data = resp.json()

        for entry in data:
            assert entry["category"] in valid_categories, (
                f"Unknown category '{entry['category']}' for {entry['name']}"
            )
