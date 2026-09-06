## 1. Backend Containerization

- [x] 1.1 Create `backend/Dockerfile` using multi-stage Python 3.11 with `uv` package manager, configuring non-root user and Uvicorn entrypoint, and verify Dockerfile syntax
- [x] 1.2 Create `backend/.dockerignore` excluding virtual environments, test files, git history, and cache directories, and verify exclusion rules

## 2. Frontend Containerization

- [x] 2.1 Create `frontend/nginx.conf` providing static asset serving, client-side SPA fallback routing (`try_files`), and gzip compression, and verify configuration correctness
- [x] 2.2 Create `frontend/Dockerfile` using multi-stage Node 20 (`npm`) build and Nginx alpine server, accepting `VITE_API_BASE_URL` and Supabase build arguments with default fallbacks, and verify build stages
- [x] 2.3 Create `frontend/.dockerignore` excluding `node_modules`, test caches, and local build artifacts, and verify exclusion rules

## 3. Multi-Service Docker Compose Orchestration

- [x] 3.1 Create `docker-compose.coolify.yml` orchestrating `backend` and `frontend` services, internal bridge networking, and environment variable bindings, and verify compose file syntax
- [x] 3.2 Configure container health checks (`/healthz` for backend, HTTP 200 for frontend) and Coolify Traefik labels in `docker-compose.coolify.yml`, and verify service definitions

## 4. Automated CI/CD Redeployment Pipeline

- [x] 4.1 Create `.github/workflows/deploy-coolify.yml` workflow configured to trigger on push to `main` branch after the primary CI workflow succeeds, and verify workflow YAML syntax
- [x] 4.2 Implement authenticated deployment webhook call via `curl` with bearer authorization using repository secrets (`COOLIFY_WEBHOOK_URL`, `COOLIFY_API_TOKEN`), and verify step configuration

## 5. Documentation & Verification

- [x] 5.1 Create `docs/coolify-deployment.md` detailing Oracle ARM VPS preparation (`oracle-arm`), Coolify setup, port configuration (80, 443, 8000), environment variables, and webhook integration, and verify documentation clarity
- [x] 5.2 Run `openspec validate coolify-vps-deployment` to verify all change artifacts satisfy schema and specification rules
