## Why

Deploying MLBlock on a self-hosted VPS (`oracle-arm`, Oracle Cloud Ampere A1 ARM64) via Coolify provides greater control, eliminates free-tier compute timeouts and spin-down latency present on shared platforms like Render, and enables cost-effective self-hosting. Establishing an automated deployment pipeline on Coolify with continuous redeployment upon pushes to `main` ensures the production instance stays up-to-date with repository changes automatically and securely.

## What Changes

- Add containerization assets for MLBlock supporting ARM64 (`linux/arm64`):
  - `backend/Dockerfile`: Multi-stage Python 3.11 + `uv` build serving FastAPI via Uvicorn.
  - `frontend/Dockerfile`: Multi-stage Node 20 (`npm`) build serving static assets via Nginx with SPA routing fallback.
  - `docker-compose.coolify.yml`: Production Compose stack for Coolify deployment, defining backend, frontend, networking, healthchecks, and environment configuration.
- Add GitHub Actions CI/CD workflow (`.github/workflows/deploy-coolify.yml`) to trigger Coolify redeployment via webhook on every push to `main`.
- Document Coolify setup instructions for the `oracle-arm` VPS, covering prerequisite ports, Docker environment, Coolify GitHub App / Webhook integration, and environment variable configuration (Supabase, Vast.ai, CORS).

## Capabilities

### New Capabilities
- `coolify-deployment`: Containerization, Docker Compose specification, Coolify application configuration on Oracle Cloud ARM64 VPS, and automated webhook-based redeployment on pushes to `main`.

### Modified Capabilities
<!-- None: No existing feature requirements or user-facing functional specs are changed. -->

## Impact

- **New Files**:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
  - `frontend/Dockerfile`
  - `frontend/nginx.conf`
  - `frontend/.dockerignore`
  - `docker-compose.coolify.yml`
  - `.github/workflows/deploy-coolify.yml`
  - `docs/coolify-deployment.md`
- **Dependencies & Architecture**:
  - Requires Docker Engine and Docker Compose v2 on the `oracle-arm` host.
  - Accommodates ARM64 (`aarch64`) architecture for PyTorch / Python dependencies and Node builds.
  - Retains existing external dependencies (Supabase Postgres pooler, Supabase Auth, Vast.ai REST API).
- **APIs**:
  - No breaking changes to existing REST endpoints or canvas contracts.
