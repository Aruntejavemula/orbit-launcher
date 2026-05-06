from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from limiter import limiter
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

load_dotenv()

_SENTRY_DSN = os.getenv("SENTRY_DSN")
if _SENTRY_DSN:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
    )

from routers import auth, apps, catalog, launches, usage, insights, reminders, preferences, api_keys, subscriptions

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
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_raw_origins = os.getenv("FRONTEND_URLS", os.getenv("FRONTEND_URL", "http://localhost:5173"))
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        for header, value in _SECURITY_HEADERS.items():
            response.headers[header] = value
        return response


access_logger = logging.getLogger("orbit.access")


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        import time
        t0 = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - t0) * 1000
        access_logger.info(
            '"%s %s" %s %.0fms',
            request.method,
            request.url.path,
            response.status_code,
            ms,
        )
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AccessLogMiddleware)


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
    logger.error("DB error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our end. Please try again in a moment."})


@app.exception_handler(Exception)
async def unhandled_exception(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    if _SENTRY_DSN:
        sentry_sdk.capture_exception(exc)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on our end. Please try again in a moment."})


_REQUIRED_ENV = ["JWT_SECRET", "DATABASE_URL", "RESEND_API_KEY"]
_missing = [k for k in _REQUIRED_ENV if not os.getenv(k)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(apps.router, prefix="/api/apps", tags=["apps"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(launches.router, prefix="/api/launches", tags=["launches"])
app.include_router(usage.router, prefix="/api/usage", tags=["usage"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["preferences"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api-keys"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["subscriptions"])


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
        "pool": await pool_status(),
    })
