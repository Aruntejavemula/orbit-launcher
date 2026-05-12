from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def _get_user_id(request: Request) -> str:
    """Key by JWT user_id when available, fall back to IP."""
    # get_current_user_id already ran as a Depends — user_id stored in request.state
    uid = getattr(request.state, "user_id", None)
    if uid:
        return f"user:{uid}"
    return get_remote_address(request)


limiter = Limiter(key_func=get_remote_address)
user_limiter = Limiter(key_func=_get_user_id)
