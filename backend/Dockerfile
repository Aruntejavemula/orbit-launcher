# Build context must be the backend/ folder (docker compose, or Railway root directory = backend).
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

USER appuser

ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "alembic upgrade head && exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
