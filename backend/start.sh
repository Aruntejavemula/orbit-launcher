#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" != "false" ] && [ "${RUN_MIGRATIONS}" != "0" ]; then
  if ! alembic upgrade head; then
    echo "WARN: alembic upgrade failed — starting API anyway (set RUN_MIGRATIONS=false to skip)"
  fi
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
