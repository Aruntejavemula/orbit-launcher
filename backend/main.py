from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, DatabaseError, IntegrityError, TimeoutError as SATimeoutError
from dotenv import load_dotenv
from database import get_db, pool_status
import logging
import logging.config
import os

load_dotenv()

from routers import auth, apps, catalog, launches, usage, insights, reminders, preferences, api_keys

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
    },
})

logger = logging.getLogger("orbit")

app = FastAPI(title="Orbit Launcher API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
async def db_operational_error(request: Request, exc: OperationalError):
    logger.error("DB connection error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database unavailable. Please try again shortly."},
    )


@app.exception_handler(SATimeoutError)
async def db_timeout_error(request: Request, exc: SATimeoutError):
    logger.error("DB timeout on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=504,
        content={"detail": "Request timed out. Please try again."},
    )


@app.exception_handler(IntegrityError)
async def db_integrity_error(request: Request, exc: IntegrityError):
    logger.warning("DB integrity error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=409,
        content={"detail": "A conflict occurred. The resource may already exist."},
    )


@app.exception_handler(DatabaseError)
async def db_error(request: Request, exc: DatabaseError):
    logger.error("DB error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred."},
    )


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(apps.router, prefix="/api/apps", tags=["apps"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(launches.router, prefix="/api/launches", tags=["launches"])
app.include_router(usage.router, prefix="/api/usage", tags=["usage"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["reminders"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["preferences"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["api-keys"])


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_reachable = True
    except OperationalError:
        logger.error("Health check: DB unreachable")
        db_reachable = False

    status_code = 200 if db_reachable else 503
    body = {
        "status": "ok" if db_reachable else "degraded",
        "db": "reachable" if db_reachable else "unreachable",
        "pool": pool_status(),
    }
    return JSONResponse(status_code=status_code, content=body)
