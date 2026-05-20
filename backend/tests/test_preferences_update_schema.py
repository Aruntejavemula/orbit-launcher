import pytest
from pydantic import ValidationError

from routers.preferences import PreferencesUpdate


class TestPreferencesUpdateValidators:
    def test_monthly_budget_accepts_valid_range(self):
        assert PreferencesUpdate(monthly_budget=1).monthly_budget == 1
        assert PreferencesUpdate(monthly_budget=100_000).monthly_budget == 100_000
        assert PreferencesUpdate(monthly_budget=None).monthly_budget is None

    @pytest.mark.parametrize("invalid", [0, -1, 100_001])
    def test_monthly_budget_rejects_out_of_range(self, invalid):
        with pytest.raises(ValidationError):
            PreferencesUpdate(monthly_budget=invalid)

    def test_country_uppercases_region_code(self):
        assert PreferencesUpdate(country="us").country == "US"
        assert PreferencesUpdate(country=None).country is None
        assert PreferencesUpdate(country="").country == ""
