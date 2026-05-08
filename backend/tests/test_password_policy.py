import pytest
from auth.password_policy import validate_password


class TestLength:
    def test_too_short(self):
        assert validate_password("Xb1!xyz", "u@e.com") is not None

    def test_exactly_8(self):
        assert validate_password("Xk9mNpQ!", "u@e.com") is None

    def test_empty(self):
        assert validate_password("", "u@e.com") is not None


class TestUppercase:
    def test_no_uppercase(self):
        result = validate_password("xkmnpqr1", "u@e.com")
        assert result is not None
        assert "uppercase" in result

    def test_has_uppercase(self):
        assert validate_password("Xkmnpq1!", "u@e.com") is None


class TestDigit:
    def test_no_digit(self):
        result = validate_password("XkmnpqrZ", "u@e.com")
        assert result is not None
        assert "number" in result

    def test_has_digit(self):
        assert validate_password("Xkmnpq1Z", "u@e.com") is None


class TestCommonPasswords:
    def test_password1_is_common(self):
        # "Password1": uppercase P, digit 1, 9 chars → passes early checks
        # lowered = "password1" which is in _COMMON set
        result = validate_password("Password1", "u@e.com")
        assert result is not None
        assert "common" in result.lower()

    @pytest.mark.parametrize("pw", [
        "password",   # fails uppercase check before reaching common check
        "123456789",  # fails uppercase check
        "qwerty",     # fails length check
    ])
    def test_common_passwords_fail_earlier_validation(self, pw):
        result = validate_password(pw, "u@e.com")
        assert result is not None

    def test_not_common(self):
        assert validate_password("Xk9$mNpQ", "u@e.com") is None


class TestSequentialPatterns:
    @pytest.mark.parametrize("pattern", [
        "0123",  # start of digit run
        "abcd",  # start of alpha run
        "qwer",  # start of qwerty run
        "asdf",  # start of home row run
    ])
    def test_forward_sequences_rejected(self, pattern):
        pw = f"X{pattern}Y1Z"
        result = validate_password(pw, "u@e.com")
        assert result is not None
        assert "sequential" in result

    @pytest.mark.parametrize("pattern", [
        "3210",  # reversed start of digit run
        "dcba",  # reversed start of alpha run
        "rewq",  # reversed start of qwerty run
        "fdsa",  # reversed start of home row run
    ])
    def test_reversed_sequences_rejected(self, pattern):
        pw = f"X{pattern}Y1Z"
        result = validate_password(pw, "u@e.com")
        assert result is not None
        assert "sequential" in result

    @pytest.mark.parametrize("pattern", [
        "1234",  # mid-run, not from start
        "2345",  # mid-run
        "6789",  # mid-run
        "bcde",  # mid-run
        "9876",  # reversed mid-run
    ])
    def test_mid_run_sequences_allowed(self, pattern):
        """Policy only blocks run[:n], not arbitrary substrings"""
        pw = f"X{pattern}Y1Z"
        result = validate_password(pw, "u@e.com")
        assert result is None

    def test_3_char_sequence_allowed(self):
        assert validate_password("X012Yz1!", "u@e.com") is None

    def test_non_sequential_digits_allowed(self):
        assert validate_password("My1357Pw", "u@e.com") is None


class TestEmailLocalPart:
    def test_contains_local_part(self):
        result = validate_password("Myuser123!", "user@example.com")
        assert result is not None
        assert "email" in result

    def test_case_insensitive(self):
        result = validate_password("MyUSER123!", "user@example.com")
        assert result is not None

    def test_no_local_part(self):
        assert validate_password("Secure123!", "user@example.com") is None

    def test_empty_local_part(self):
        # Edge case: email with empty local part
        assert validate_password("Secure123!", "@example.com") is None


class TestValidPasswords:
    @pytest.mark.parametrize("pw", [
        "Tr0ub4dor!",
        "MyStr0ngP@ss",
        "C0mplexPw!xyz",
        "Xk9$mNpQr2",
    ])
    def test_strong_passwords_pass(self, pw):
        assert validate_password(pw, "test@example.com") is None
