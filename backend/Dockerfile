ARG BUILDER_BASE=python:3.11-slim@sha256:9c900dea9e8fb7e16277c179b555cc72d29a352dbc33cff48ad5a0412fd5bfc7
ARG RUNTIME_BASE=gcr.io/distroless/python3-debian12:nonroot@sha256:7d1042ce588ab97019fe95c24ffca7bc5a82ccdac572511d5e09bda4435c89c5

# =============================================================================
# STAGE 1 — builder
# =============================================================================
FROM ${BUILDER_BASE} AS builder

ARG SOURCE_DATE_EPOCH

WORKDIR /app

ENV PYTHONHASHSEED=0 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --target=/install -r requirements.txt

# ◄── FIX 1: Rewrite pip's hardcoded shebang (#!/usr/local/bin/python) 
#            to Distroless's Python path (#!/usr/bin/python3)
RUN sed -i '1s|^#!.*|#!/usr/bin/python3|' /install/bin/* 2>/dev/null || true && \
    chmod +x /install/bin/* 2>/dev/null || true

COPY . /app

RUN find /install /app -exec touch -h --date="@${SOURCE_DATE_EPOCH:-0}" {} +

# =============================================================================
# STAGE 2 — runtime (Distroless)
# =============================================================================
FROM ${RUNTIME_BASE} AS runtime

ARG GIT_SHA=unknown
ARG VERSION=1.0.0
ARG MAINTAINER="bruce@bruceminanga.world"

WORKDIR /app

ENV PYTHONHASHSEED=0 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/opt/site-packages \
    PATH="/opt/site-packages/bin:${PATH}"

USER nonroot:nonroot

COPY --chown=nonroot:nonroot --from=builder /install /opt/site-packages
COPY --chown=nonroot:nonroot --from=builder /app /app

EXPOSE 8000

# ◄── FIX 2: Reset ENTRYPOINT so binaries like opentelemetry-instrument 
#            and gunicorn execute directly from $PATH
ENTRYPOINT []

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--graceful-timeout", "30"]