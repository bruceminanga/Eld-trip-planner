# frontend/Dockerfile.prod

# ---- Build Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# 1. Copy package files (including package-lock.json if present)
# Copying lock files ensures reproducible installs and leverages layer caching.
COPY package.json package-lock.json* ./

# 2. Use BuildKit caching + 'npm ci' instead of 'npm install'
# - 'npm ci' is up to 2-3x faster than 'npm install' in Docker/CI environments.
# - '--mount=type=cache' caches downloaded packages on your machine across builds.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# 3. Copy source code AFTER dependencies are installed
# This prevents reinstalling node_modules when only source code changes.
COPY . .

# 4. Build the static files
RUN npm run build


# ---- Production Stage ----
FROM nginx:stable-alpine AS final

# Overwrite default Nginx configuration directly
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80