# syntax=docker/dockerfile:1
# ── Stage 1: Build client assets with Node 20 ─────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package.json package-lock.json /app/
RUN npm ci

# Build-time environment variables inlined by Vite
ARG VITE_API_BASE_URL="http://localhost:8000"
ARG VITE_SUPABASE_URL="https://placeholder.supabase.co"
ARG VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_placeholder"
ARG SITE_URL="https://mlblock.local"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    SITE_URL=$SITE_URL \
    NODE_ENV=production

# Copy source code and build
COPY . /app/
RUN npm run build

# ── Stage 2: Serve static files with Nginx Alpine ─────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx configurations
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist/client /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
