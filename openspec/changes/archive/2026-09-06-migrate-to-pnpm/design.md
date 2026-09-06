## Context

See `proposal.md` for motivation. Currently, the repository is split into two independent directory trees without monorepo workspace tooling:
- `frontend/`: Managed via `npm` with Node 20/22, `package-lock.json`, Vite 7, TanStack Start/Router, and Tailwind v4.
- `backend/`: Managed via `uv` with Python >=3.10 (target 3.11), `pyproject.toml`, and `uv.lock`. A legacy `backend/requirements.txt` remains from early project scaffolding.

## Goals / Non-Goals

**Goals:**
- Migrate `frontend/` package management entirely to `pnpm` (v9+ on Node 22+).
- Generate and commit `frontend/pnpm-lock.yaml` and remove `frontend/package-lock.json`.
- Add `"packageManager": "pnpm@..."` to `frontend/package.json`.
- Update `frontend/Dockerfile` to install dependencies and build with `pnpm`.
- Update CI workflow (`.github/workflows/ci.yml`) to setup `pnpm` with dependency caching.
- Update `render.yaml` build commands to use `pnpm`.
- Remove legacy `backend/requirements.txt` to eliminate dependency drift and assure `uv` exclusivity.
- Update `AGENTS.md` to reflect `pnpm` (frontend) and `uv` (backend).

**Non-Goals:**
- Converting the repository into a pnpm monorepo workspace (backend remains Python/uv, frontend remains independent Node/pnpm sub-directory).
- Upgrading major dependency versions or altering application logic.

## Decisions

### Decision 1: Subdirectory Isolation over Root Monorepo Workspace
- **Choice**: Keep `frontend/` and `backend/` as independent subdirectories without a root `pnpm-workspace.yaml`.
- **Rationale**: The backend is exclusively Python and uses `uv`. Introducing a root JavaScript workspace would add unneeded configuration overhead without any code sharing benefits.
- **Alternatives Considered**: Creating a root `package.json` with pnpm workspaces. Rejected as unnecessary complexity for a two-tier polyglot architecture.

### Decision 2: pnpm Installation Strategy in CI and Docker
- **Choice**: In GitHub Actions, use `pnpm/action-setup@v4`. In Docker (`frontend/Dockerfile`), install pnpm globally via `npm install -g pnpm@9` (or `corepack enable pnpm`).
- **Rationale**: Standard, fast, and supported across both Linux x86_64 and ARM64 container platforms.
- **Alternatives Considered**: Committing standalone pnpm binaries. Rejected to avoid repository bloat.

### Decision 3: Handling pnpm Strict Dependency Isolation
- **Choice**: Use a standard `frontend/.npmrc` with `auto-install-peers=true`.
- **Rationale**: Vite, React 19, and Tailwind v4 work well with pnpm's symlinked `node_modules`, while `auto-install-peers=true` prevents peer dependency resolution errors during clean installs.
- **Alternatives Considered**: Using `node-linker=hoisted` (npm emulation). Rejected because strict non-flat resolution is a primary benefit of pnpm.

### Decision 4: Deletion of Legacy `backend/requirements.txt`
- **Choice**: Delete `backend/requirements.txt`.
- **Rationale**: `requirements.txt` has been stale, lacks torch/torchvision, and includes extraneous packages. Deleting it prevents confusion and ensures developers and tools exclusively use `uv sync` and `uv.lock`.
- **Alternatives Considered**: Keeping it with a warning header. Rejected because automated scanners or developers might still invoke `pip install -r requirements.txt`.

## Risks / Trade-offs

- **[Risk] Phantom dependencies break Vite build under pnpm's strict node_modules** → **Mitigation**: Run `pnpm run build` locally during implementation. If any missing transitive dependency is flagged, declare it explicitly in `package.json`.
- **[Risk] CI pipeline failure on pnpm cache or missing action** → **Mitigation**: Use official `pnpm/action-setup@v4` with Node 22 setup and verify workflow YAML.
- **[Risk] Docker build failure on pnpm command in alpine** → **Mitigation**: Test Docker build locally using `docker build` to guarantee `pnpm install --frozen-lockfile` succeeds.

## Migration Plan

1. Install `pnpm` in `frontend/`, generate `pnpm-lock.yaml` from existing dependencies, and delete `package-lock.json`.
2. Add `.npmrc` with `auto-install-peers=true`.
3. Verify `pnpm install`, `pnpm run build`, `pnpm test`, and `pnpm run lint`.
4. Update `frontend/Dockerfile` and `docker-compose.coolify.yml`.
5. Update `.github/workflows/ci.yml` and `render.yaml`.
6. Remove `backend/requirements.txt`.
7. Update `AGENTS.md` to reflect `pnpm` and `uv`.
