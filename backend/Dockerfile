# syntax=docker/dockerfile:1
# ── Stage 1: Build virtual environment with uv ───────────────────────────
FROM python:3.11-slim-bookworm AS builder

# Install uv from official binary image
COPY --from=ghcr.io/astral-sh/uv:0.5.29 /uv /bin/uv

# Compile bytecode and disable cache during container build
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies if needed for packages compiling native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install project dependencies without project source first for optimal Docker layer caching
COPY pyproject.toml uv.lock /app/
RUN uv sync --frozen --no-dev --no-install-project

# Copy project source and install project
COPY mlblock /app/mlblock
RUN uv sync --frozen --no-dev

# ── Stage 2: Minimal runtime image ─────────────────────────────────────────
FROM python:3.11-slim-bookworm AS runner

WORKDIR /app

# Runtime libraries required by psycopg2, torch, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root system user and group
RUN groupadd -g 10001 mlblock && \
    useradd -u 10001 -g mlblock -s /bin/bash -m mlblock

# Copy installed virtual environment and application code from builder
COPY --from=builder --chown=mlblock:mlblock /app/.venv /app/.venv
COPY --from=builder --chown=mlblock:mlblock /app/mlblock /app/mlblock

# Set path to use virtual environment
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    MLBLOCK_RUN_MODE=gpu

EXPOSE 8000

USER mlblock

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/healthz || exit 1

CMD ["sh", "-c", "uvicorn mlblock.server.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
