# syntax=docker/dockerfile:1

# --- Stage 1: Build Stage ---
FROM python:3.11.5-slim-bullseye AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --wheel-dir /app/wheels -r requirements.txt


# --- Stage 2: Final/Production Stage ---
FROM python:3.11.5-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    apt-get update && \
    apt-get install -y --no-install-recommends libpq5

RUN addgroup --system app && adduser --system --group app && \
    mkdir -p /app/staticfiles && \
    chown -R app:app /app

# [COMBINED RUN COMMAND] Install and clean in the SAME layer so space is actually freed
RUN --mount=type=bind,from=builder,source=/app/wheels,target=/wheels \
    pip install --no-cache-dir /wheels/* && \
    find /usr/local/lib/python3.11/site-packages/ -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages/ -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

COPY --chown=app:app . .

USER app

RUN SECRET_KEY=dummy-for-build-does-not-matter \
    DATABASE_URL=sqlite:///dummy-for-build.db \
    python manage.py collectstatic --noinput

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["python", "healthcheck.py"]

CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]