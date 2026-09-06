## Why

Migrating the frontend to `pnpm` improves installation speed, disk efficiency, and dependency isolation by enforcing strict non-flat `node_modules` that prevent undeclared phantom dependencies. Concurrently, establishing and locking the backend tooling contract guarantees that `uv` is the exclusive Python environment and package manager, ensuring reproducible, high-performance runtimes across development, CI/CD, and production container builds.

## What Changes

- **Frontend Package Management**:
  - Migrate frontend dependency management from `npm` to `pnpm` (v9+ on Node 22+).
  - Generate and commit `frontend/pnpm-lock.yaml`, and remove `frontend/package-lock.json`.
  - Update `package.json` package manager field (`"packageManager": "pnpm@..."`).
  - Update `frontend/Dockerfile` to use `pnpm` for clean multi-stage container builds.
  - Update `.github/workflows/ci.yml` to install pnpm via `pnpm/action-setup` with dependency caching.
- **Backend Python Tooling Assurance**:
  - Enforce `uv` (Python >=3.10, targeted to Python 3.11) as the sole backend package manager and runtime orchestrator.
  - Ensure `uv.lock` remains the single canonical backend lockfile across local development (`uv run`), CI/CD (`uv sync`), and Docker builds.
  - Formally prohibit legacy `pip` and remove or deprecate stale `backend/requirements.txt` to eliminate dependency drift.
- **Documentation & Workflow Alignment**:
  - Update `AGENTS.md` and repo guidelines to reflect the unified `pnpm` (frontend) and `uv` (backend) standard.

## Capabilities

### New Capabilities
- `backend-tooling`: Declares and enforces Python >=3.10 runtime requirements and specifies `uv` as the sole package manager, virtualenv orchestrator, and test/lint runner backed by `uv.lock`.

### Modified Capabilities
- `frontend-tooling`: Updates requirements from npm to pnpm as the sole frontend package manager, tracking `pnpm-lock.yaml` instead of `package-lock.json`.

## Impact

- **Affected Files**:
  - `frontend/package.json`
  - `frontend/package-lock.json` (removed)
  - `frontend/pnpm-lock.yaml` (added)
  - `frontend/Dockerfile`
  - `backend/requirements.txt` (removed or marked obsolete)
  - `.github/workflows/ci.yml`
  - `render.yaml`
  - `AGENTS.md`
- **Dependencies & Systems**:
  - Developers and CI require `pnpm` (Corepack or standalone) and `uv` installed.
  - No runtime functional changes to MLBlock canvas, API routes, or database schemas.
