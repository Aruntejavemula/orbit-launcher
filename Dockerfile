# Monorepo build: use when Railway build context is the repository root (not backend/).
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN chmod +x start.sh

USER appuser

ENV PYTHONUNBUFFERED=1

CMD ["./start.sh"]
