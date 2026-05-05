import bcrypt

# bcrypt truncates silently at 72 bytes — enforce explicitly
_BCRYPT_MAX = 72


def hash_password(password: str) -> str:
    secret = password.encode()[:_BCRYPT_MAX]
    return bcrypt.hashpw(secret, bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    secret = plain.encode()[:_BCRYPT_MAX]
    return bcrypt.checkpw(secret, hashed.encode())
