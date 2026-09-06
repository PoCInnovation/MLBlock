# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Build arguments for Vite
ARG VITE_API_BASE_URL="http://backend.141.253.110.210.sslip.io"
ARG VITE_SUPABASE_URL="https://placeholder.supabase.co"
ARG VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_placeholder"
ARG SITE_URL="http://frontend.141.253.110.210.sslip.io"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    SITE_URL=$SITE_URL \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Copy source code and build
COPY . .
RUN pnpm run build

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3000/ || exit 1

CMD ["pnpm", "run", "start"]
