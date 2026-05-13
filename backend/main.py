from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter, user_limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, DatabaseError, IntegrityError, TimeoutError as SATimeoutError
from dotenv import load_dotenv
from database import get_db, pool_status
import logging
import logging.config
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

_APP_ENV = os.getenv("APP_ENV", "dev")
_env_file = os.path.join(os.path.dirname(__file__), f".env.{_APP_ENV}")
if os.path.isfile(_env_file):
    load_dotenv(_env_file, override=True)
load_dotenv()

_SENTRY_DSN = os.getenv("SENTRY_DSN")
if _SENTRY_DSN:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
    )

from routers import auth, apps, catalog, launches, activity, insights, reminders, preferences, api_keys, subscriptions, push

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s %(levelname)-8s %(name)s  %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "orbit": {"level": LOG_LEVEL, "propagate": True},
        "orbit.db": {"level": LOG_LEVEL, "propagate": True},
        "orbit.access": {"level": "INFO", "propagate": True},
    },
})

logger = logging.getLogger("orbit")


@asynccontextmanager
async def lifespan(app: FastAPI):
    from job_queue import get_queue_pool, close_queue_pool
    import job_queue as jq
    import time
    try:
        await get_queue_pool()
        logger.info("Redis queue pool connected")
    except Exception as exc:
        logger.warning("Redis unavailable — email will fall back to inline: %s", exc)
        # Pre-mark dead so first request skips the Redis retry immediately
        jq._redis_dead_until = time.monotonic() + jq._DEAD_BACKOFF
    yield
    await close_queue_pool()


app = FastAPI(title="Orbit Launcher API", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.state.user_limiter = user_limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.getenv("FRONTEND_URLS", os.getenv("FRONTEND_URL", "http://localhost:5173"))
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

_cors_kwargs = dict(
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

_500_BODY = b'{"detail":"Internal server error"}'
_500_HEADERS = [
    (b"content-type", b"application/json"),
    (b"content-length", str(len(_500_BODY)).encode()),
]


class CatchAllMiddleware:
    """Pure ASGI catch-all — BaseHTTPMiddleware wraps exceptions in ExceptionGroup
    on Python 3.11+, breaking @app.exception_handler(Exception). This sits outside
    all BaseHTTPMiddleware layers and guarantees a safe 500 for anything that escapes."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            import sentry_sdk as _sentry
            _logger = logging.getLogger("orbit")
            _logger.exception("Unhandled error escaped middleware: %s %s",
                              scope.get("method", "?"), scope.get("path", "?"))
            _sentry.capture_exception(exc)
            try:
                await send({"type": "http.response.start", "status": 500, "headers": _500_HEADERS})
                await send({"type": "http.response.body", "body": _500_BODY, "more_body": False})
            except Exception:
                pass


_LIMIT_DEFAULT = int(os.getenv("BODY_LIMIT_MB", "1")) * 1024 * 1024
_LIMIT_UPLOAD  = int(os.getenv("BODY_LIMIT_UPLOAD_MB", "2")) * 1024 * 1024
_UPLOAD_PATHS  = {"/api/uploads"}   # extend if file-upload routes are added

_413_BODY = b'{"detail":"Request too large"}'
_413_HEADERS = [
    (b"content-type", b"application/json"),
    (b"content-length", str(len(_413_BODY)).encode()),
]


class BodySizeLimitMiddleware:
    """Pure ASGI middleware — checks Content-Length header first, then streams."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        limit = _LIMIT_UPLOAD if path in _UPLOAD_PATHS else _LIMIT_DEFAULT

        # Fast path: trust Content-Length if present
        headers = dict(scope.get("headers", []))
        cl = headers.get(b"content-length")
        if cl is not None:
            try:
                if int(cl) > limit:
                    await self._reject(send)
                    return
            except ValueError:
                pass

        # Streaming path: count bytes as they arrive
        consumed = 0
        overflow = False

        async def checked_receive():
            nonlocal consumed, overflow
            message = await receive()
            if message["type"] == "http.request":
                consumed += len(message.get("body", b""))
                if consumed > limit:
                    overflow = True
            return message

        async def checked_send(message):
            if overflow and message["type"] == "http.response.start":
                return
            await send(message)

        await self.app(scope, checked_receive, checked_send)

        if overflow:
            await self._reject(send)

    @staticmethod
    async def _reject(send):
        await send({"type": "http.response.start", "status": 413, "headers": _413_HEADERS})
        await send({"type": "http.response.body", "body": _413_BODY, "more_body": False})


_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        return response


class UserIdMiddleware(BaseHTTPMiddleware):
    """Populate request.state.user_id from JWT so user_limiter can key by it."""
    async def dispatch(self, request: Request, call_next):
        from auth.jwt import COOKIE_NAME, decode_token
        from jose import JWTError
        try:
            token = request.cookies.get(COOKIE_NAME)
            if not token:
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    token = auth_header[7:].strip()
            if token:
                claims = decode_token(token)
                request.state.user_id = claims["user_id"]
                request.state.token_version = claims["token_version"]
        except (JWTError, HTTPException):
            pass
        return await call_next(request)


access_logger = logging.getLogger("orbit.access")


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import uuid as _uuid
        request_id = request.headers.get("X-Request-ID") or str(_uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import time
        t0 = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - t0) * 1000
        req_id = getattr(request.state, "request_id", "-")
        access_logger.info(
            '[%s] "%s %s" %s %.0fms',
            req_id[:8],
            request.method,
            request.url.path,
            response.status_code,
            ms,
        )
        return response


# add_middleware is LIFO — last registered = outermost at runtime.
# Runtime execution order (outermost → innermost):
#   SecurityHeadersMiddleware → CORSMiddleware → AccessLogMiddleware
#   → BodySizeLimitMiddleware → CatchAllMiddleware → UserIdMiddleware → router
#
# SecurityHeaders and CORS must be outer to BodySizeLimit and CatchAll so
# their short-circuit 413/500 responses still pass through both layers and
# the browser receives correct CORS + security headers on every response type.
app.add_middleware(UserIdMiddleware)
app.add_middleware(CatchAllMiddleware)
app.add_middleware(BodySizeLimitMiddleware)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(AccessLogMiddleware)
app.add_middleware(CORSMiddleware, **_cors_kwargs)
app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(OperationalError)
async def db_operational_error(request: Request, exc: OperationalError):
    logger.error("DB connection error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=503, content={"detail": "Database unavailable. Please try again shortly."})


@app.exception_handler(SATimeoutError)
async def db_timeout_error(request: Request, exc: SATimeoutError):
    logger.error("DB timeout on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=504, content={"detail": "Request timed out. Please try again."})


@app.exception_handler(IntegrityError)
async def db_integrity_error(request: Request, exc: IntegrityError):
    logger.warning("DB integrity error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=409, content={"detail": "That item already exists. Please try a different name or value."})


@app.exception_handler(DatabaseError)
async def db_error(request: Request, exc: DatabaseError):
    logger.exception("DB error on %s %s", request.method, request.url.path)
    sentry_sdk.capture_exception(exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    sentry_sdk.capture_exception(exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    messages = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        messages.append(f"{field}: {err.get('msg', 'invalid')}" if field else err.get("msg", "invalid"))
    return JSONResponse(status_code=422, content={"detail": messages})


_REQUIRED_ENV = ["JWT_SECRET", "DATABASE_URL", "RESEND_API_KEY"]
_missing = [k for k in _REQUIRED_ENV if not os.getenv(k)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(apps.router, prefix="/api/apps", tags=["apps"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(launches.router, prefix="/api/launches", tags=["launches"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["preferences"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api-keys"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])
app.include_router(push.router, prefix="/api/push", tags=["push"])


@app.get("/api/health")
async def health(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_reachable = True
    except OperationalError:
        logger.error("Health check: DB unreachable")
        db_reachable = False

    redis_reachable = False
    try:
        from job_queue import get_queue_pool
        pool = await get_queue_pool()
        await pool.ping()
        redis_reachable = True
    except Exception:
        pass

    healthy = db_reachable
    status_code = 200 if healthy else 503
    return JSONResponse(status_code=status_code, content={
        "status": "ok" if healthy else "degraded",
        "db": "reachable" if db_reachable else "unreachable",
        "redis": "reachable" if redis_reachable else "unreachable",
    })
