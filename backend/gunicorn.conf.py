# gunicorn.conf.py
import os
import multiprocessing

# Bind to all interfaces
bind = "0.0.0.0:8000"

# Worker processes - can be overridden with environment variable
workers = int(os.environ.get("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))

# Worker class
worker_class = "sync"

# Worker connections
worker_connections = 1000

# Timeout settings
timeout = 30
keepalive = 5

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"  # Log to stderr
loglevel = "info"

# Security limits
limit_request_line = 4094
limit_request_fields = 100

# Performance optimization
preload_app = True

# Graceful worker restarts
max_requests = 1000
max_requests_jitter = 100
