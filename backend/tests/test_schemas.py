import pytest
from pydantic import ValidationError

from schemas.auth import RegisterRequest, LoginRequest, UserUpdate
from schemas.app import AppCreate, AppUpdate


class TestRegisterRequest:
    def test_valid_registration(self):
        req = RegisterRequest(name="John", email="john@example.com", password="Secret123")
        assert req.name == "John"
        assert req.email == "john@example.com"

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            RegisterRequest(name="x" * 101, email="j@e.com", password="Secret123")

    def test_name_empty(self):
        with pytest.raises(ValidationError):
            RegisterRequest(name="", email="j@e.com", password="Secret123")

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            RegisterRequest(name="John", email="not-an-email", password="Secret123")

    def test_password_too_short(self):
        with pytest.raises(ValidationError):
            RegisterRequest(name="John", email="j@e.com", password="Sh0rt")

    def test_password_too_long(self):
        with pytest.raises(ValidationError):
            RegisterRequest(name="John", email="j@e.com", password="A" * 73)

    def test_password_exactly_72(self):
        req = RegisterRequest(name="John", email="j@e.com", password="A1" + "x" * 70)
        assert len(req.password) == 72


class TestLoginRequest:
    def test_valid_login(self):
        req = LoginRequest(email="user@test.com", password="MyPass123")
        assert req.remember_me is False  # default

    def test_remember_me_true(self):
        req = LoginRequest(email="u@e.com", password="MyPass123", remember_me=True)
        assert req.remember_me is True


class TestUserUpdate:
    def test_all_optional(self):
        update = UserUpdate()
        assert update.name is None
        assert update.email is None
        assert update.avatar_url is None

    def test_valid_https_avatar(self):
        update = UserUpdate(avatar_url="https://example.com/avatar.png")
        assert "https" in str(update.avatar_url)

    def test_valid_data_uri_avatar(self):
        update = UserUpdate(avatar_url="data:image/png;base64,abc123")
        assert update.avatar_url.startswith("data:image")


class TestAppCreate:
    def test_valid_app(self):
        app = AppCreate(
            name="Figma",
            slug="figma",
            color="ff7262",
            url="https://figma.com",
            category="design",
            plan="paid",
        )
        assert app.name == "Figma"
        assert app.color == "ff7262"

    def test_color_strips_hash(self):
        app = AppCreate(
            name="App", slug="app", color="#ff7262",
            url="https://example.com", category="ai",
        )
        assert app.color == "ff7262"

    def test_invalid_color(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="app", color="xyz",
                url="https://example.com", category="ai",
            )

    def test_slug_pattern(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="Invalid Slug!",
                color="ff0000", url="https://example.com", category="ai",
            )

    def test_valid_slug(self):
        app = AppCreate(
            name="App", slug="my-app-123",
            color="ff0000", url="https://example.com", category="ai",
        )
        assert app.slug == "my-app-123"

    def test_url_must_be_https(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="app", color="ff0000",
                url="http://example.com", category="ai",
            )

    def test_invalid_category(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="app", color="ff0000",
                url="https://example.com", category="invalid",
            )

    def test_valid_categories(self):
        for cat in ["ai", "design", "productivity", "finance", "music"]:
            app = AppCreate(
                name="App", slug="app", color="ff0000",
                url="https://example.com", category=cat,
            )
            assert app.category == cat

    def test_valid_plans(self):
        for plan in ["free", "paid", "trial"]:
            app = AppCreate(
                name="App", slug="app", color="ff0000",
                url="https://example.com", category="ai", plan=plan,
            )
            assert app.plan == plan

    def test_monthly_cost_range(self):
        app = AppCreate(
            name="App", slug="app", color="ff0000",
            url="https://example.com", category="ai",
            monthly_cost=9.99,
        )
        assert app.monthly_cost == 9.99

    def test_monthly_cost_negative(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="app", color="ff0000",
                url="https://example.com", category="ai",
                monthly_cost=-1,
            )

    def test_monthly_cost_too_high(self):
        with pytest.raises(ValidationError):
            AppCreate(
                name="App", slug="app", color="ff0000",
                url="https://example.com", category="ai",
                monthly_cost=100000,
            )


class TestAppUpdate:
    def test_all_optional(self):
        update = AppUpdate()
        # Should not raise

    def test_partial_update(self):
        update = AppUpdate(name="New Name", color="00ff00")
        assert update.name == "New Name"
        assert update.color == "00ff00"
