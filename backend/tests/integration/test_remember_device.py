"""Remember-device session endpoint."""
import pytest
from httpx import AsyncClient

from tests.integration.conftest import seed_user, make_auth_cookie


@pytest.mark.asyncio
async def test_remember_device_toggle(int_client: AsyncClient, db_session):
    user = await seed_user(db_session)
    await db_session.commit()
    cookies = make_auth_cookie(user.id, user.token_version)

    me = await int_client.get("/api/auth/me", cookies=cookies)
    assert me.status_code == 200
    assert me.json().get("remember_device") is False

    on = await int_client.post(
        "/api/auth/remember-device",
        json={"remember_device": True},
        cookies=cookies,
    )
    assert on.status_code == 200
    assert on.json()["remember_device"] is True
    new_cookies = dict(on.cookies)

    me2 = await int_client.get("/api/auth/me", cookies=new_cookies)
    assert me2.status_code == 200
    assert me2.json()["remember_device"] is True
