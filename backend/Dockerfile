# --- Stage 1: Build Stage ---
FROM python:3.11.5-slim-bullseye AS builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build-time system dependencies and clean up in one layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements and build wheels for faster final installation
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# --- Stage 2: Final/Production Stage ---
FROM python:3.11.5-slim-bullseye

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder stage
COPY --from=builder /app/wheels /wheels

# Install dependencies from wheels
RUN pip install --no-cache /wheels/*

# Create a non-root user for security
RUN addgroup --system app && adduser --system --group app

# Copy the application code into the container
# This step is done as root
COPY . .

# Run collectstatic AS ROOT with all necessary dummy variables
# This ensures it has permissions to write to STATIC_ROOT
RUN SECRET_KEY=dummy-for-build \
    DEBUG=0 \
    SQL_ENGINE=django.db.backends.sqlite3 \
    SQL_DATABASE=/tmp/dummy.db \
    SQL_USER=dummy \
    SQL_PASSWORD=dummy \
    SQL_HOST=dummy \
    SQL_PORT=1234 \
    python manage.py collectstatic --noinput

# Change ownership of the entire app directory to the non-root user
# This is the final step before switching user
RUN chown -R app:app /app

# Switch to the non-root user. ALL subsequent commands run as 'app'.
USER app

# Expose the port Gunicorn will run on
EXPOSE 8000

# Healthcheck to ensure the Django app can start
# (Note: A more robust check might hit a specific health check URL)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD ["python", "healthcheck.py"]

# The command to run the application using Gunicorn and its config file
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]