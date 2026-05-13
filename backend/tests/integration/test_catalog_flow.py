"""
Integration tests for the /api/catalog router.

Catalog is a static list — tests verify shape, no auth required.
"""
import pytest


class TestCatalog:
    async def test_returns_200(self, int_client, db_session):
        resp = await int_client.get("/api/catalog")
        assert resp.status_code == 200

    async def test_returns_list(self, int_client, db_session):
        resp = await int_client.get("/api/catalog")
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_each_entry_has_required_fields(self, int_client, db_session):
        resp = await int_client.get("/api/catalog")
        for entry in resp.json():
            assert "name" in entry
            assert "slug" in entry
            assert "color" in entry
            assert "category" in entry
            assert "url" in entry

    async def test_color_is_hex(self, int_client, db_session):
        resp = await int_client.get("/api/catalog")
        import re
        for entry in resp.json():
            assert re.match(r"^[0-9A-Fa-f]{6}$", entry["color"]), (
                f"Invalid color for {entry['name']}: {entry['color']}"
            )

    async def test_url_is_https(self, int_client, db_session):
        resp = await int_client.get("/api/catalog")
        for entry in resp.json():
            assert entry["url"].startswith("https://"), (
                f"{entry['name']} URL not https: {entry['url']}"
            )

    @pytest.mark.parametrize("slug", ["claude", "openai", "notion", "figma"])
    async def test_well_known_slugs_present(self, int_client, db_session, slug):
        resp = await int_client.get("/api/catalog")
        slugs = [e["slug"] for e in resp.json()]
        assert slug in slugs, f"Expected slug '{slug}' in catalog"
