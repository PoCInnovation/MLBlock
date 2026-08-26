# AGENTS.md

MLBlock — no-code block DAG builder for ML/RL/DL. React canvas (React 19 + Vite + TanStack Router + Astryx) + FastAPI + Pydantic v2 + SQLModel/Postgres (Supabase). Deploy: Render. GPU dispatch: Vast.ai REST only (no SSH).

## Structure

- `backend/` — Python >=3.10, `uv` only (`uv.lock` committed). `pyproject.toml` is canonical; `requirements.txt` is stale — never edit it.
- `frontend/` — `npm` only (`package-lock.json`). No `bun`/`pnpm`/`yarn`. No `.nvmrc`. Vite + `tanstackRouter` plugin + Tailwind v4.
- `tutos/` + `frontend/src/content/cours/` — markdown tutorials.

## Commands

Backend from `backend/`:
```bash
uv sync                          # install (.venv)
uv run python -m mlblock --mode generate   # codegen (default configs/cnn_mnist.json)
uv run python -m mlblock config.json --mode build
uv run uvicorn mlblock.server.main:app --reload  # dev server :8000
uv run ruff check .              # lint (E,F only; blocks/** ignores E501)
uv run pytest mlblock/tests -q              # all; add path for single file
uv run pytest mlblock/tests/test_graph.py -v
```

Frontend from `frontend/`:
```bash
npm install
npm run dev                      # Vite, no proxy — hits VITE_API_BASE_URL directly
npm run build                    # tsc --noEmit && vite build
npm run lint -- --max-warnings 0 # must pass zero warnings
npm run knip                     # unused exports check (local only, not in CI)
npm test                         # vitest run (node env, store/utils only)
```

CI (`.github/workflows/ci.yml`): backend `ruff check` + `pytest`; frontend `build` + `vitest` + `eslint --max-warnings 0`. Concurrency `ci-${ref}` cancels in-flight.

## Architecture

- **Block discovery** `backend/mlblock/blocks/registry.py:_discover()` runs at import. Scans `blocks/{category}-{HEXCOLOR}/*.py`, loads via `importlib.util.spec_from_file_location` (hyphens in dirs), registers module-level functions into `BLOCK_REGISTRY` + legacy `BlockRegistry`. File stem = block key.
- **Execution**: `JSON {nodes,edges} -> ConfigLoader.validate() -> Graph (Kahn topo sort, cycle=ValueError) -> Pipeline.run() / generate_code()`. `generate_code()` emits standalone Python with `notify_status`/`notify_output(block_id)` callbacks (20k truncation).
- **Server** `backend/mlblock/server/`: 7 routers (catalog, samples, pipelines, validation, jobs, files, health) in `routes.py`. Sync `def` endpoints (`session: Session = Depends(get_session)`). `ValueError -> HTTPException(400)`. `graph_data = raw.get("graph", raw)` shape.
- **Auth**: Supabase JWT (`server/auth.py`, JWKS TTL cache, `MLBLOCK_DEV_AUTH` bypass in dev) + GPU bearer per-job `instance_api_key` (`server/gpu_auth.py`, fallback `GPU_API_KEY`).
- **Jobs**: `POST /api/pipelines/{id}/execute` -> `Job` row -> local subprocess (`MLBLOCK_RUN_MODE=local`, default dev) or Vast.ai (`gpu`, `render.yaml`) with gzip/base64 `onstart`. GPU callbacks `POST /api/jobs/{id}/status|output|error` -> `job_outputs.block_id` (indexed) -> Supabase Realtime `postgres_changes` -> `hooks/useBlockRunner.ts` (poll 3s job / 2s outputs + Realtime) -> `store/jobOutputs`.
- **Frontend routing**: file-based `src/routes/*` + `routeTree.gen.ts`; `main.tsx` is `createRouter(routeTree)` + QueryClient + Supabase auth listener with `pending-stash` localStorage. `router.tsx` is deprecated shim — don't use.
- **State**: single Zustand store `store/useAppStore.ts` is canvas truth (`flowNodes`/`flowEdges`, `savedFingerprint` dirty check, undo/redo 50, `jobOutputs`/`results` synced). Never fork it.
- **Vite**: no dev proxy. Frontend calls `VITE_API_BASE_URL` directly (`frontend/.env` -> `http://localhost:8000` locally; Render injects prod URL).

## Conventions

- **Blocks**: plain functions, no base class. Port `in_1: "torch.Tensor"`, outputs `out_1` etc. `import torch/nn` at top OK; sklearn/gymnasium/pandas inside function. Docstring line1=French label, line2=French summary; param suffixes `(entre: min-max, pas: x)` `(impair)` `(choix: a|b)` `(suggestions:)` `(format:)` `(longueur:)`.
- **Python**: `from __future__ import annotations`, Pydantic v2 `model_validate(context={"registry": BLOCK_REGISTRY})`, `NotImplementedError` if no builder.
- **Frontend**: RHF+zod only on auth pages; editor params are segment-driven `BlockNode` fields. Styling is Astryx (`@astryxdesign/core` + `@stylexjs/stylex`) + Tailwind v4 — `index.css` layer order `reset,theme,base,astryx-base,astryx-theme,components,utilities`. Dark mode forced `data-theme="dark"`. Editor is free-mode only — don't reintroduce columns/grid. `TapGuard` + `tap-to-add` is mobile-only; "Disposer" (dagre) is explicit `ControlButton` — never auto-run.
- **Unsaved guard**: `useBlocker` from `@tanstack/react-router` (not `react-router-dom`) + `beforeunload` + `mlblock-pending-{userId}` stash. Don't regress.

## Testing

- Backend: `conftest.py` skips if `DATABASE_URL` absent (no SQLite fallback). `client` fixture creates real engine (`statement_timeout=10000`), overrides `get_session`/`get_current_user`/`verify_gpu_key`, creates one Supabase auth user via Admin API (`SUPABASE_URL`+`SUPABASE_SECRET_KEY`), purges that user's `pipelines` per-test (cascade jobs/outputs). `catalog_client` needs no DB. `BlockRegistry` is class-level and persists across tests; some tests register global blocks without cleanup.
- Frontend: `vitest run` node env, no jsdom — only `store/*.test.ts` + `utils/*.test.ts`.
- No `pytest` config in `pyproject.toml`; default discovery. `tsconfig` is `strict`, `moduleResolution: bundler`, no path aliases.

## Env & Gotchas

- `DATABASE_URL` = Supabase pooler `:6543` transaction mode, IPv4. Percent-encode `?`->`%3F` `@`->`%40` `*`->`%2A`. Free-tier project can pause -> DB timeouts while auth looks healthy.
- `MLBLOCK_RUN_MODE=local|gpu` (default `local`); `render.yaml` sets `gpu`. Mock Vast key (`mock-*`) forces local.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` required in `frontend/.env` for auth. Backend needs `SUPABASE_URL/PUBLISHABLE_KEY/SECRET_KEY/JWKS_URL/JWT_SECRET`, `VAST_API_KEY`, `BACKEND_URL`, `GPU_API_KEY`.
- `mlblock/__init__.py` triggers block discovery on import — importing touches FS even without DB.
- `backend/main.py` is generated output — ignore.

## Docs for agents

- Issue tracker: GitHub Issues — `gh` CLI. See `docs/agents/issue-tracker.md`.
- Triage labels: `needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`. See `docs/agents/triage-labels.md`.
- Domain: single-context `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
