# Repository Guidelines

## Project Overview

MLBlock is a no-code, block-based ML/RL/DL builder ("Scratch, but for AI"). Users compose pipelines as DAGs of blocks (neural layers, sklearn models, data loaders, RL environments) in a React canvas. Pipelines validate, run locally, code-generate into standalone Python scripts, and can dispatch to rented GPUs via Vast.ai. Backend: FastAPI + Pydantic v2 + SQLModel on PostgreSQL (Supabase). Frontend: React 18 + Vite + TypeScript. Deployed on Render.

## Architecture & Data Flow

Two-layer system bridged at import time:

```
JSON config → ConfigLoader.validate() → Graph (DAG) → Pipeline
                                                         ├→ run()            (execute blocks in topo order)
                                                         └→ generate_code()  → standalone Python script
```

- **Core engine** (`backend/mlblock/core/`): dict-based `GraphNode`/`Edge`/`Graph`, Kahn's topological sort (cycle → `ValueError`), `BlockMeta`/`BlockRegistry` (class-level dict), `Pipeline` orchestration with param coercion, `CodeGenerator` (emits standalone Python), `VastAI` client (**REST only** — `requests`, Vast API v0 bundles/asks/instances, onstart gzip/base64 payload; no SSH).
- **Server layer** (`backend/mlblock/server/`): FastAPI with 7 routers (catalog, samples, pipelines, validation, jobs, files, health). Sync `def` endpoints, `session: Session = Depends(get_session)`. `ValueError` → `HTTPException(400, detail=str(e))`. Dual auth: Supabase JWT (`server/auth.py`, JWKS TTL cache, `MLBLOCK_DEV_AUTH` bypass) + GPU bearer (`server/gpu_auth.py`, per-job `instance_api_key` with global `GPU_API_KEY` fallback). DB tables in `server/models.py`: `profiles`, `pipelines`, `jobs`, `job_outputs` (UUID PKs, JSON `nodes`/`edges`, FK CASCADE; the old `columns` field was dropped by migration — free mode only).
- **Bridge**: `blocks/registry.py` `_discover()` runs at import time, scans `blocks/**/*.py` (dirs named `{category}-{HEXCOLOR}/`, e.g. `neural-4FC3F7/`), loads via `importlib.util.spec_from_file_location`, registers module-level functions into `BLOCK_REGISTRY` (server Pydantic models), `BLOCK_SOURCES` (source text), and legacy `BlockRegistry` (core execution dict).
- **Frontend** (`frontend/src/`): `router.tsx` (`createBrowserRouter` + `RequireAuth`, 7 routes), `store/useAppStore.ts` (single Zustand store: reactflow `flowNodes`/`flowEdges`, `savedFingerprint` dirty detection, undo/redo 50-deep, `loadPipeline`/`savePipeline`/`ensureDraft`), `api/client.ts` (axios + Supabase session interceptor, zod-validated responses). UI: Tailwind v4 (`@theme` tokens in `index.css`) + JS tokens in `theme.ts`; Base UI dialog; **no shadcn**. Editor is free-mode only (grid/columns removed); mobile-first: palette drawer <768px, tap-to-add gated to mobile, handles ≥22px on `pointer: coarse`, header wraps ≤900px, landing hamburger nav; "Disposer" auto-layout button (dagre) in the ReactFlow Controls cluster.

Execution flow: user saves pipeline → `POST /api/pipelines` → `POST /{id}/execute` creates `Job` row → local subprocess (`MLBLOCK_RUN_MODE=local`, dev) or Vast dispatch (`gpu`) → GPU runs generated code → HTTP callbacks `POST /api/jobs/{id}/status|output|error` → results in `jobs`/`job_outputs`.

## Key Directories

```
backend/
├── mlblock/
│   ├── core/          # graph.py, pipeline.py, config.py, generator.py, block.py, vast.py
│   ├── blocks/        # {category}-{HEX}/ dirs, one file per block; registry.py discovers
│   ├── server/        # main.py, routes.py, auth.py, gpu_auth.py, database.py, models.py, schemas.py
│   ├── models/        # pipeline.py only: PipelineDef/Node/Edge (v2 Pydantic)
│   ├── configs/       # cnn_mnist.json and other pipeline JSON configs
│   ├── scripts/       # generate_samples.py, validate_exercises.py
│   └── tests/         # 7 pytest files (see Testing & QA)
├── pyproject.toml     # canonical deps — uv
└── requirements.txt   # STALE — drifts from pyproject (adds stable-baselines3, drops torchvision); uv ignores it
frontend/
└── src/
    ├── api/           # client.ts (axios + zod)
    ├── components/    # flow/ (FlowCanvas, BlockNode, FlowLink, FlowPalette), ui/ (dialog, dropdown-menu, card, hover-card, field, ConsolePanel, modals, Toast)
    ├── pages/         # EditorPage.tsx (unsaved-changes guard), Login/Register, …
    ├── store/         # useAppStore.ts (single Zustand store)
    ├── schemas/       # auth.ts (RHF+zod)
    └── utils/         # pending-stash.ts (localStorage dirty stash), fingerprint, layout.ts (dagre "Disposer"), tapGuard.ts (mobile tap-vs-drag), typeCheck, portResolution, exportImport
.github/               # release-drafter.yml only — NO CI test workflow
render.yaml            # backend web service + frontend static site
backend/main.py        # GENERATED code output example — not a source file; ignore
```

## Development Commands

All backend commands run from `backend/` with `uv`; frontend from `frontend/` with npm:

```bash
uv sync                                   # Install deps (creates .venv)
uv run python -m mlblock                  # Codegen from default config (configs/cnn_mnist.json)
uv run python -m mlblock config.json --mode build   # Build + run model
uv run python -m mlblock.server           # uvicorn on 127.0.0.1:8000
uv run uvicorn mlblock.server.main:app --reload     # Dev server
uv run pytest mlblock/tests               # All tests (tests skip without DATABASE_URL)
uv run pytest mlblock/tests/test_graph.py # Single file
uv run python scripts/generate_samples.py # Upsert French sample datasets to Supabase Storage
npm install
npm run dev                               # Vite dev server (no proxy — calls VITE_API_BASE_URL)
npm run build                             # tsc --noEmit && vite build
npm test                                  # vitest run (store + utils tests)
```

There is no CI test workflow: only `.github/workflows/release-drafter.yml` exists. No lint command exists for either stack (no eslint/prettier/ruff configured).

## Code Conventions & Common Patterns

- **Python >=3.10**, `from __future__ import annotations` in most core files. Pydantic v2 (`BaseModel`, `model_validator`, `Field`); `PipelineDef.model_validate(context={"registry": BLOCK_REGISTRY})`.
- **Blocks are plain module-level functions** — no base class. File stem = registration key. Signature: first param `in_1`, outputs `out_1`, `out_2`, … Ports annotated as strings: `in_1: "torch.Tensor"`.
- **Docstring contract**: line 1 = French label, line 2 = French summary; param metadata via suffix conventions: `(entre: min-max, pas: x)`, `(impair)`, `(choix: a|b)`, `(suggestions: s1|s2)`, `(format: ...)`, `(longueur: N)`.
- **Import discipline**: `import torch`/`nn` at module level is fine (conv2d.py); sklearn/gymnasium/pandas/torchvision imported lazily inside the function body.
- **Error handling**: `ValueError` in core validation, `HTTPException(400)` at FastAPI layer, `NotImplementedError` in `BlockMeta.execute()` when no builder registered.
- **Async**: everything sync except FastAPI lifespan. Routes are `def`, not `async def`.
- **French in user-facing strings** (UI labels, errors, docstrings), English in code and identifiers.
- **Frontend state**: single Zustand store is the source of truth for the flow canvas; catalog fetched via TanStack Query → `setCatalog` backfills node `segs`. Never fork store state. Dirty check is `fingerprintOf(state) !== savedFingerprint` (semantic fields only).
- **Editor canvas**: free mode only (no viewMode/columns). Tap-to-add is **mobile-only** — the desktop palette sidebar must never call `onAdd` (click stays inert; mobile drawer instance passes it). Handle sizing ≥22px lives in `@media (pointer: coarse)` inside `@layer utilities` (wins the cascade against `w-[14px]!`). "Disposer" (dagre auto-layout) is a custom `ControlButton` child of `<Controls>` — explicit action only, `commitUndoPoint()` before applying, never auto-run. Edge delete buttons: EdgeLabelRenderer + `getPointAtLength`, commit undo before remove.
- **Frontend forms**: RHF + zod only on auth pages (`Controller` + `zodResolver`); editor param forms are segment-driven custom fields in `BlockNode`.
- **Unsaved-changes guard**: `useBlocker(() => isDirty())` in EditorPage + Base UI `UnsavedChangesDialog` + `beforeunload` + localStorage stash (`mlblock-pending-{userId}`). Don't regress it.

## Important Files

| File | Role |
|---|---|
| `backend/mlblock/server/main.py` | FastAPI app factory, CORS, router includes |
| `backend/mlblock/__main__.py` | CLI: `--mode generate|build` (default config `configs/cnn_mnist.json`) |
| `backend/mlblock/blocks/registry.py` | Import-time block auto-discovery (`_discover()`) |
| `backend/mlblock/core/pipeline.py` | `Pipeline.run()` / `generate_code()` orchestration |
| `backend/mlblock/core/generator.py` | Standalone-script codegen (notify callbacks, `_self_destroy`) |
| `backend/mlblock/core/config.py` | `ConfigLoader.load/validate` — config JSON → Graph |
| `backend/mlblock/server/models.py` | SQLModel ORM: `profiles`, `pipelines`, `jobs`, `job_outputs` |
| `backend/mlblock/server/auth.py` / `gpu_auth.py` | JWT verification / per-job GPU bearer keys |
| `backend/mlblock/configs/cnn_mnist.json` | Reference config: `{graph: {nodes[], edges[]}}`, node `{id, type, params, ports{in/out[{name, dtype}]}}`, edge `{source, source_port, target, target_port}` |
| `frontend/src/router.tsx` | `createBrowserRouter` + `RequireAuth` route table |
| `frontend/src/store/useAppStore.ts` | Single Zustand store (canvas state, fingerprint, undo/redo) |
| `frontend/src/api/client.ts` | Axios instance + Supabase session interceptor + zod response validation |
| `frontend/src/utils/layout.ts` | Pure `arrangeGraph()` (dagre TB, ranksep 80 / nodesep 50, center→top-left) — "Disposer" button |
| `frontend/src/utils/tapGuard.ts` | Mobile tap-vs-drag guard (`shouldIgnoreTap`, 8px threshold) |
| `frontend/.env.example` | `VITE_API_BASE_URL` (default `http://localhost:8000`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

Env vars (backend): `DATABASE_URL` (Supabase pooler `:6543`, transaction mode, IPv4), `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`/`JWKS_URL`/`JWT_SECRET`, `VAST_API_KEY`, `BACKEND_URL`, `GPU_API_KEY`, `MLBLOCK_RUN_MODE=local|gpu`, `MLBLOCK_DEV_AUTH`.

## Runtime/Tooling Preferences

- **Backend**: uv only (`backend/uv.lock` committed). Python `>=3.10` (Render pins 3.11). No `[project.scripts]`, no `.python-version`. `pyproject.toml` is canonical; `requirements.txt` is stale — never edit it as source of truth.
- **Frontend**: npm is the only supported frontend package manager (`package-lock.json`; no bun/pnpm/yarn). Non-npm lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`) must not be added. Node version **unpinned** (no `.nvmrc`). React 18 runtime with @types/react 19 — type/runtime skew is known. Build = type-check + bundle; no lint gate. Test = `vitest run` (node env, no jsdom — store/utils only, no component tests). Key deps beyond React: reactflow 11, zustand, @tanstack/react-query, @dagrejs/dagre.
- **No Vite dev proxy**: frontend calls `VITE_API_BASE_URL` directly (set to `http://localhost:8000` in `frontend/.env` for local dev; Render build sets the deployed backend URL).
- **tsconfig**: `strict: true`, `moduleResolution: bundler`, `noEmit`, no path aliases.
- **DB**: real PostgreSQL required — **no SQLite fallback** in server code (tests skip, they don't fake it). Percent-encode special chars in pooler passwords (`?` → `%3F`, `@` → `%40`, `*` → `%2A`). Supabase free-tier project can pause and cause DB timeouts while auth logs look healthy.
- **Render**: backend `uv sync` + `.venv/bin/uvicorn mlblock.server.main:app --host 0.0.0.0 --port $PORT`; frontend static from `dist` with SPA rewrite `/* → /index.html`.

## Testing & QA

- **pytest + httpx** (`fastapi.testclient.TestClient`), ~106 tests across 7 files in `backend/mlblock/tests/` (7 pre-existing failures on block/category/auth 404 routes — unrelated to feature work).
- **Frontend vitest**: 6 files / 53 tests in `frontend/src/{store,utils}/*.test.ts` (useAppStore, layout, tapGuard, portResolution, typeCheck, exportImport) — pure logic only, node env, no component rendering (no jsdom/@testing-library installed). Component-level behavior is verified manually in the browser.
- **DB/auth strategy** (`conftest.py`): reads `DATABASE_URL` and `pytest.skip("DATABASE_URL not set")` if absent; real engine with `statement_timeout=10000`; per-test purge of test user's rows; creates one shared test user via Supabase Admin API (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`, skips if unset). Auth bypassed via `app.dependency_overrides` (`get_current_user` → fixed UUID, `verify_gpu_key` → `"gpu"`); `test_auth.py` exercises real Supabase JWT signup/signin instead.
- **No pytest config in pyproject** — default discovery; no `testpaths`/env injection.
- Coverage: registry, config, graph/topo sort, codegen text, type/port system, param metadata, pipeline CRUD/drafts/limits (20-project 409), validate/generate/build, jobs + GPU callback auth, samples manifest, real JWT, dagre layout, mobile tap guard. **Gaps**: VastAI client (only `FakeVast`), real GPU execution, Storage downloads, frontend components.
- Gotchas: `mlblock/__init__.py` triggers block discovery at import — importing `mlblock` touches DB if `DATABASE_URL` is set. `BlockRegistry` is class-level; blocks persist across tests in a shared process (no teardown needed). Tests register global test blocks (`src2`, `coerce_test`, `dst1`) without unregistering — cross-file pollution risk if run order changes.
