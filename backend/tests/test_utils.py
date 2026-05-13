import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException
from utils import get_or_404, as_utc, apply_partial_update


class TestAsUtc:
    def test_naive_datetime_becomes_utc(self):
        dt = datetime(2025, 1, 15, 12, 0, 0)
        result = as_utc(dt)
        assert result.tzinfo == timezone.utc
        assert result.hour == 12

    def test_utc_datetime_unchanged(self):
        dt = datetime(2025, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        result = as_utc(dt)
        assert result == dt

    def test_other_timezone_converted(self):
        ist = timezone(timedelta(hours=5, minutes=30))
        dt = datetime(2025, 1, 15, 17, 30, 0, tzinfo=ist)
        result = as_utc(dt)
        assert result.tzinfo == timezone.utc
        assert result.hour == 12
        assert result.minute == 0


class TestApplyPartialUpdate:
    def test_sets_attributes(self):
        class Obj:
            name = "old"
            color = "red"

        obj = Obj()
        apply_partial_update(obj, {"name": "new", "color": "blue"})
        assert obj.name == "new"
        assert obj.color == "blue"

    def test_empty_dict_no_change(self):
        class Obj:
            name = "old"

        obj = Obj()
        apply_partial_update(obj, {})
        assert obj.name == "old"

    def test_sets_none_value(self):
        class Obj:
            expires_at = "2025-01-01"

        obj = Obj()
        apply_partial_update(obj, {"expires_at": None})
        assert obj.expires_at is None


@pytest.mark.asyncio
class TestGetOr404:
    async def test_returns_object_when_found(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = {"id": "123"}
        mock_db = AsyncMock()
        mock_db.execute.return_value = mock_result

        result = await get_or_404(mock_db, "fake_stmt")
        assert result == {"id": "123"}

    async def test_raises_404_when_not_found(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db = AsyncMock()
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            await get_or_404(mock_db, "fake_stmt")
        assert exc_info.value.status_code == 404

    async def test_custom_detail_message(self):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db = AsyncMock()
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            await get_or_404(mock_db, "fake_stmt", detail="App not found.")
        assert exc_info.value.detail == "App not found."
