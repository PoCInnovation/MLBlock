## 1. Frontend pnpm Migration & Lockfile Generation

- [x] 1.1 Configure `frontend/.npmrc` with `auto-install-peers=true` and add `"packageManager": "pnpm@9.15.4"` to `frontend/package.json`, and verify configuration files
- [x] 1.2 Generate `frontend/pnpm-lock.yaml` via pnpm install and remove `frontend/package-lock.json`, verifying that only `pnpm-lock.yaml` is tracked in git
- [x] 1.3 Verify frontend scripts execute successfully with pnpm (`pnpm test`, `pnpm run lint`, `pnpm run build`), verifying zero errors

## 2. Docker & Containerization Tooling

- [x] 2.1 Update `frontend/Dockerfile` to install pnpm and execute `pnpm install --frozen-lockfile && pnpm run build`, and verify build success via `docker build`
- [x] 2.2 Update `frontend/.dockerignore` to ignore pnpm store and local artifacts (`.pnpm-store`), and verify exclusion rules

## 3. CI/CD & Deployment Configuration

- [x] 3.1 Update `.github/workflows/ci.yml` frontend job to install pnpm via `pnpm/action-setup@v4` with Node 22 and pnpm caching, and verify workflow YAML syntax
- [x] 3.2 Update `render.yaml` frontend build command to use `pnpm install --frozen-lockfile && VITE_API_BASE_URL=... pnpm run build`, and verify configuration syntax

## 4. Backend uv Tooling Assurance & Cleanup

- [x] 4.1 Delete obsolete `backend/requirements.txt` and verify that `backend/pyproject.toml` and `backend/uv.lock` are the sole dependency tracking files
- [x] 4.2 Verify backend environment synchronization and tests using `uv sync` and `uv run pytest mlblock/tests -q`, confirming zero reliance on pip or requirements.txt

## 5. Documentation & Verification

- [x] 5.1 Update `AGENTS.md` to establish `pnpm` as the exclusive frontend package manager and reiterate `uv` as the backend standard, and verify documentation accuracy
- [x] 5.2 Run `openspec validate migrate-to-pnpm` to verify all change artifacts satisfy schema and specification rules
