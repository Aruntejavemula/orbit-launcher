import re

SEQUENTIAL_RUNS = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop", "asdfghjkl", "zxcvbnm",
]

_COMMON = {
    "password", "password1", "123456", "1234567", "12345678",
    "123456789", "1234567890", "111111", "000000", "qwerty",
    "abc123", "letmein", "welcome", "monkey", "dragon",
}


def validate_password(password: str, email: str) -> str | None:
    """Return an error message, or None if valid."""
    if len(password) < 8:
        return "Password must be at least 8 characters."

    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."

    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number."

    lower = password.lower()

    if lower in _COMMON:
        return "Password is too common. Choose something more unique."

    for run in SEQUENTIAL_RUNS:
        for n in range(4, len(run) + 1):
            chunk = run[:n]
            if chunk in lower or chunk[::-1] in lower:
                return f"Password must not contain sequential patterns like '{chunk}'."

    local = email.split("@")[0].lower()
    if local and local in lower:
        return "Password must not contain your email address."

    return None
