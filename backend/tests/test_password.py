import pytest
from auth.password import hash_password, verify_password


class TestHashPassword:
    def test_returns_bcrypt_hash(self):
        hashed = hash_password("TestPass1")
        assert hashed.startswith("$2b$")

    def test_different_hashes_for_same_password(self):
        h1 = hash_password("TestPass1")
        h2 = hash_password("TestPass1")
        assert h1 != h2  # different salts

    def test_truncates_at_72_bytes(self):
        long_pw = "A" * 100
        hashed = hash_password(long_pw)
        # Should still produce valid hash
        assert verify_password(long_pw, hashed)

    def test_handles_unicode(self):
        pw = "Pässwörd123"
        hashed = hash_password(pw)
        assert verify_password(pw, hashed)


class TestVerifyPassword:
    def test_correct_password(self):
        hashed = hash_password("MySecret1")
        assert verify_password("MySecret1", hashed) is True

    def test_wrong_password(self):
        hashed = hash_password("MySecret1")
        assert verify_password("WrongPass1", hashed) is False

    def test_empty_password_fails(self):
        hashed = hash_password("SomePass1")
        assert verify_password("", hashed) is False

    def test_case_sensitive(self):
        hashed = hash_password("MySecret1")
        assert verify_password("mysecret1", hashed) is False

    def test_72_byte_boundary(self):
        # Passwords identical up to 72 bytes should match
        pw72 = "A" * 72
        pw100 = "A" * 100
        hashed = hash_password(pw72)
        assert verify_password(pw100, hashed) is True
