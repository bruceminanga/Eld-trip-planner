# =============================================================================
# STAGE 1 — Builder
# Node 22.14.0-alpine pinned by Multi-Arch SHA256 Index
# =============================================================================
FROM --platform=$BUILDPLATFORM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS builder

WORKDIR /app

# Install dependencies with BuildKit cache mount
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# Copy source code and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# =============================================================================
# STAGE 2 — Runtime
# Chainguard Distroless Nginx (Hardened, Non-Root UID 65532)
# =============================================================================
# Pin by SHA256 or specific version tag for reproducibility
FROM cgr.dev/chainguard/nginx@sha256:d826cd7cff4e5a8f9477e685696cbddb47c33df1b8dc22c7d581e16ff70e44aa AS runtime

ARG GIT_SHA=unknown
ARG VERSION=1.0.0
ARG MAINTAINER="bruce@bruceminanga.world"

# OCI Standard Metadata Labels
LABEL org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.authors="${MAINTAINER}" \
      org.opencontainers.image.base.name="cgr.dev/chainguard/nginx"

# (Optional) Copy custom nginx configuration for SPA routing / security headers
COPY --chown=65532:65532 nginx.prod.conf /etc/nginx/conf.d/default.conf

# Copy compiled static output with non-root ownership (UID 65532)
COPY --chown=65532:65532 --from=builder /app/dist /usr/share/nginx/html

# Chainguard Nginx listens on port 8080 by default
EXPOSE 8080

# Chainguard base image automatically provides the ENTRYPOINT and CMD:
# Entrypoint: ["/usr/sbin/nginx"]
# CMD: ["-c", "/etc/nginx/nginx.conf", "-e", "/dev/stderr", "-g", "daemon off;"]