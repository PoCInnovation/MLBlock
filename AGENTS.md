# Repository Guidelines

## Project Overview

MLBlock ("Scratch for ML") is a visual no-code DAG builder for ML/DL/RL for learning and prototyping. Users assemble typed blocks on a ReactFlow canvas; FastAPI validates the graph, code-gens a standalone Python script by inlining block sources, and executes locally (subprocess) or on Vast.ai GPUs, streaming status/outputs back via Supabase Postgres + Realtime with polling fallback.

Two independent roots, no monorepo tooling: `backend/` (Python FastAPI + SQLModel) and `frontend/` (React 19 + Vite 7 + TanStack Router/Start).

## Architecture & Data Flow

```
[ReactFlow canvas: FlowCanvas + BlockNode]
  → [Zustand useAppStore + pipelineDocument.toServerPayload]
  → [axios api/client + Supabase JWT + zod parseOrThrow]
  → [FastAPI routes.py (Depends(get_session), get_current_user)]
  → [validation.validate: Kahn topo-sort + port/dtype check]
  → [catalog: BLOCK_REGISTRY via blocks/registry._discover]
  → [generator.generate_code: inline block source + notify_* callbacks]
  → [execution: LocalBackend (Popen) | VastBackend (REST)] — switched by MLBLOCK_RUN_MODE
  → [generated script POST /api/jobs/{id}/{status,output,error} (gpu_auth)]
  → [SQLModel Job / JobOutput rows]
  → [useBlockRunner: 3s status / 2s outputs poll + Realtime INSERT on job_outputs]
  → [ResultsPanel / JournalPanel]
```

Type flow: block `.py` signature + French docstring → `registry` parse → `GET /api/catalog` → `toSegments` → `Segment` renderers. Edge verdicts computed symmetrically by `backend/mlblock/core/types.py: classify` and `frontend/src/utils/typeCheck.ts: classifyEdge`, resolved by `portResolution` (exact 3 > family/wildcard 2 > convertible 1) + `connection.canConnect`.

Key modules: `blocks/registry.py` (FS discovery), `catalog.py` (facade), `validation.py` (single truth `{valid,errors,order}`), `core/types.py` (`family_of`, transformations-only conversion graph), `core/block.py` (`BlockMeta`, `coerce_params`), `core/generator.py` (`generate_code`), `execution.py` (`ExecutionBackend` Protocol), `server/auth.py` (JWKS + 1h cache, `MLBLOCK_DEV_AUTH` bypass), `server/gpu_auth.py` (per-instance bearer), `store/pipelineDocument.ts` (pure converters + undo).

## Key Directories

```
backend/mlblock/blocks/{category}-{HEXCOLOR}/*.py  # block library, one .py per op
backend/mlblock/core/    # block.py, types.py, generator.py, vast.py
backend/mlblock/models/  # pipeline.py Pydantic defs with registry-aware validators
backend/mlblock/server/  # main.py, routes.py, database.py, models.py, schemas.py, auth.py, gpu_auth.py
backend/mlblock/tests/   # pytest suites (unit + API/integration)
backend/scripts/         # generate_samples.py, validate_exercises.py
frontend/src/api/        # client.ts (axios + JWT interceptor + zod)
frontend/src/components/flow/  # FlowCanvas.tsx, BlockNode.tsx, palette, journal
frontend/src/components/blocks/ # BlockSegments.tsx (Segment renderers)
frontend/src/hooks/      # useBlockRunner.ts (validate→save→build→execute→listen)
frontend/src/store/      # useAppStore.ts (canvas truth), pipelineDocument.ts (pure payload/fingerprint/undo)
frontend/src/utils/      # typeCheck.ts, portResolution.ts, connection.ts, layout, exportImport
frontend/src/routes/ + pages/  # TanStack file routes: index/editor/cours/projets/login/register/about
frontend/src/content/cours/     # zod-validated course Markdown (SEO source)
frontend/scripts/        # generate-seo.mjs (post-build sitemap/robots/llms.txt)
docs/                    # routes.md, coolify-deployment.md, supabase-auth.md, keep-alive.md
```

Vocabulary (`CONTEXT.md`): use Block / Catalog / Pipeline / Job; never Bloc / Registry / Graph / Run / Task. Roadmap: `todo.md`.

## Development Commands

Backend — run from `backend/`, `uv` ONLY (never `pip`):

```bash
uv sync                          # install into .venv
uv sync --dev                    # + httpx/pytest/ruff
uv run uvicorn mlblock.server.main:app --reload --port 8000
uv run python -m mlblock --mode generate                  # codegen from default configs/cnn_mnist.json
uv run python -m mlblock configs/cnn_mnist.json --mode build  # in-process build+execute
uv run ruff check .              # lint
uv run pytest mlblock/tests -q
uv run pytest mlblock/tests/test_validation.py -v   # single file
uv run pytest mlblock/tests -k "test_catalog"       # filter
uv run python scripts/generate_samples.py           # needs SUPABASE_URL + SUPABASE_SECRET_KEY
```

Frontend — run from `frontend/`, `pnpm` ONLY (never `npm`/`yarn`/`bun`):

```bash
pnpm install                     # CI: pnpm install --frozen-lockfile
pnpm run dev                     # Vite dev (direct CORS to VITE_API_BASE_URL, default http://localhost:8000)
pnpm run build                   # tsc --noEmit && vite build && node scripts/generate-seo.mjs
pnpm test                        # vitest run; single: pnpm vitest run src/utils/typeCheck.test.ts
pnpm run lint -- --max-warnings 0  # CI gate: zero warnings
pnpm run knip                    # unused exports/deps (not in CI)
```

Deploy: `docker compose -f docker-compose.coolify.yml up --build` (Coolify/Traefik) or Render blueprint `render.yaml`. `deploy-coolify.yml` is webhook-only, runs no tests.

## Code Conventions & Common Patterns

Backend (`backend/mlblock/blocks/*/*.py`, `server/routes.py`):

- `from __future__ import annotations` on every Python file.
- Blocks are pure functions, no base classes. Data ports MUST use `in_` prefix + string annotation; heavy deps function-local:
```python
def load_csv(path: "file" = "data.csv") -> "pd.DataFrame":
    """Charger un fichier CSV
    Charge un tableau tabulaire depuis un fichier local ou Supabase Storage.
    path: Chemin du fichier CSV (format: .csv)
    """
    import pandas as pd  # heavy imports inside body (fast discovery)
    return pd.read_csv(path)
```
- Block docstring: line 1 label (FR), line 2 summary (FR); constraints as `(entre: min-max, pas: x)`, `(choix: a|b)`, `(format: .csv)`.
- Handlers are sync `def` (sync SQLModel sessions), DI via `Depends(get_session)` / `Depends(get_current_user)` / `Depends(verify_gpu_key)`; input errors → `HTTPException(status_code=400, detail=str(e))`.
- Blocks live in `blocks/{category}-{HEXCOLOR}/`; color/suffix parsed by discovery. Never bypass `catalog.py` facade.

Frontend (`frontend/src/`):

- Never bypass `store/useAppStore.ts`; `flowNodes`/`flowEdges` are canvas truth. All ReactFlow↔server conversion goes through pure `store/pipelineDocument.ts` (`toServerPayload`, `backfillNodes`, `fingerprintOf`, 50-step undo).
- Free-form canvas only: no grid snap on drop, no auto-layout except manual "Disposer" (Dagre). Styling: Astryx + StyleX + Tailwind v4, layer order in `index.css`, enforced `data-theme="dark"`.
- API: `api/client.ts` (axios + Supabase token interceptor) + `schemas/api.ts` zod `parseOrThrow`. React Hook Form + zod only on auth forms; canvas params use Segment controls. Unsaved guard: `useBlocker` + `beforeunload` vs `savedFingerprint`, stash in `localStorage mlblock-pending-{userId}`.
- Relative imports only (no path aliases); TS `strict`, `moduleResolution: bundler`.

## Important Files

| Path | Role |
|---|---|
| `backend/mlblock/server/main.py` | ASGI entry (`mlblock.server.main:app`), CORS, 7 routers |
| `backend/mlblock/__main__.py` | CLI `python -m mlblock --mode generate\|build` |
| `backend/mlblock/validation.py`, `core/types.py`, `core/generator.py`, `execution.py` | validate / classify / codegen / backends |
| `backend/mlblock/blocks/registry.py`, `catalog.py`, `core/block.py` | discovery / facade / BlockMeta IR |
| `backend/mlblock/server/routes.py`, `database.py`, `models.py`, `schemas.py`, `auth.py`, `gpu_auth.py` | HTTP / DB engine + session DI / SQLModel tables / zod-mirror Pydantic / JWT / GPU guard |
| `backend/pyproject.toml`, `backend/uv.lock` | deps + ruff (E+F, 120 cols, `blocks/**` exempt E501) + lockfile |
| `frontend/src/main.tsx`, `src/router.tsx`, `index.html` | bootstrap (StrictMode + QueryClient + Router) / routes / shell |
| `frontend/src/store/useAppStore.ts`, `src/store/pipelineDocument.ts` | canvas state / pure document logic |
| `frontend/src/hooks/useBlockRunner.ts`, `src/api/client.ts` | run orchestration / typed client |
| `frontend/package.json`, `frontend/pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js` | scripts + pnpm 9.15.4 pin + lockfile + SPA/SSG switch + strict TS + flat lint |
| `backend/.env.example` | canonical env template (pooler URL, Supabase, Vast, GPU callback) |
| `render.yaml`, `docker-compose.coolify.yml`, `backend/Dockerfile`, `frontend/Dockerfile` | deploy targets |
| `.github/workflows/ci.yml` | lint+test gate (backend ruff+pytest, frontend build+vitest+eslint) |

Docs: `docs/routes.md` (API reference), `docs/coolify-deployment.md` (VPS playbook), `docs/supabase-auth.md` (OAuth wiring), `docs/keep-alive.md` (UptimeRobot on `/health`; never a GH Actions cron).

## Runtime/Tooling Preferences

- Python ≥3.10, 3.11 canonical (CI + both Docker stages + `render.yaml`). `uv` exclusively; `uv.lock` committed; no `requirements.txt`.
- Node 22, `pnpm@9.15.4` exclusively (CI `pnpm/action-setup@v4`, Docker corepack, `.npmrc auto-install-peers=true`). No `npm`/`yarn`/`bun`, no `.nvmrc`, no monorepo orchestration.
- Frontend build duality: dev = SPA router; prod = TanStack Start prerender (`failOnError: true`, `SITE_URL`, `PRERENDER_CONCURRENCY`). Build needs placeholder `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` even headless.
- Env: `DATABASE_URL` must be Supabase pooler `:6543` transaction mode with percent-encoded password (`?`→`%3F`, `@`→`%40`, `*`→`%2A`). `MLBLOCK_RUN_MODE=local` (dev) | `gpu` (prod); `VAST_API_KEY=mock-*` forces local. Vite has no proxy — `CORS_ORIGINS` must allow the frontend origin.
- Ignore generated `backend/main.py` (codegen artifact, never edit/commit). Paused free-tier Supabase → DB timeouts while auth looks healthy.

## Testing & QA

- No coverage thresholds, no E2E (Playwright dir is MCP logs), no mypy/pyright.
- Backend (`backend/mlblock/tests/`, pytest, no config section): pure unit `test_graph.py`, `test_config.py`, `test_types.py`, `test_validation.py`, `test_pipeline.py`, `test_block.py` (in-memory, no DB/network); integration `test_server.py`, `test_auth.py`. Fixtures in `conftest.py`: `catalog_client` (plain `TestClient`, secret-free, runs in CI) vs `client` (live PG, provisions `test-<hex>@mlblock.test` via Admin API, purges that user's pipelines per test). Tests without secrets skip — CI without secrets is green but partial. No SQLite fallback. `BlockRegistry` is process-global: custom test registrations leak across tests.
- Frontend (Vitest defaults, Node env — no `jsdom`): colocated `src/store/useAppStore.test.ts` (fingerprint, undo cap 50 + redo truncation) + `src/utils/*.test.ts` (`typeCheck`, `layout`, `portResolution`, `exportImport` incl. malformed-JSON French error, `tapGuard`). Components/routes intentionally untested. Build (`tsc`) runs before tests in CI, so type errors fail the job even if Vitest passes.
- CI (`.github/workflows/ci.yml`, all push/PR): backend `uv sync --dev` → `ruff check .` → `pytest`; frontend `pnpm build` → `pnpm test` → `eslint --max-warnings 0`.

## Agent skills

### Issue tracker

Issues and specs tracked in GitHub Issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` at root, ADRs under `docs/adr/`). See `docs/agents/domain.md`.
