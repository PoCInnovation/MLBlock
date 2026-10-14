# Repository Guidelines

## Project Overview

MLBlock is a no-code, block-based ML/RL/DL builder ("Scratch, but for AI"). Users assemble pipelines as DAGs of blocks — PyTorch layers, sklearn models, data loaders, RL envs — in a ReactFlow canvas. Pipelines validate, run locally, generate standalone Python, and dispatch to Vast.ai GPUs. Backend: FastAPI + Pydantic v2 + SQLModel on Supabase PostgreSQL. Frontend: React 19 + Vite + TypeScript. Deployed on Coolify (Docker Compose on Oracle ARM64 VPS: FastAPI backend + Nginx/serve frontend, auto-redeploy on push to `main`).

**Stages**: `S0 Ingest`, `S1 Prepare`, `S2 Represent` (S2A DL / S2B ML), `S3 Train` (S3A DL / S3B ML), `S4 Eval`, `SX World` (RL isolé).

Strict domain vocabulary (docs, commits, code):
- **Block**: reusable executable Python unit (`in_` ports, docstring metadata). *Forbidden: Bloc, Component, Service.*
- **Catalog**: dynamic block discovery and indexing. *Forbidden: Registry, BlockRegistry.*
- **Pipeline**: DAG of placed blocks and typed edges. *Forbidden: Graph, DAG, Workflow.*
- **Job**: execution instance of a pipeline. *Forbidden: Run, Execution, Task.*

## Architecture & Data Flow

Two-layer system bridged at import time:

```
JSON config → ConfigLoader.validate() → Graph (DAG) → Pipeline
                                                         ├→ run()            (topo-order block execution)
                                                         └→ generate_code()  → standalone Python script
```

- **Core engine** (`backend/mlblock/core/`): `GraphNode`/`Edge`/`Graph` (Kahn topo sort, cycle → `ValueError`), `BlockMeta`/`BlockRegistry` (class-level dict, `_coerce_param_value`), `Pipeline` (`run` via `_value_for` single/multi-output, `generate_code` delegates to `CodeGenerator`), `CodeGenerator` (deduped `BLOCK_SOURCES`, emits `notify_status`/`output`/`error` + `_self_destroy` + `_serialize_output` + gzip envelope, image bytes via `POST artifact`), `VastAI` (REST only: `requests`, `POST /bundles`, `PUT /asks/{id}`, `PUT /instances/{id}`, `DELETE`; tiny bootstrap onstart fetching code via `GET /jobs/{id}/code`; no SSH), `types.py` (`family_of`, `build_conversion_graph` from `transformations` blocks only, `classify` → compatible/convertible/incompatible).

- **Server layer** (`backend/mlblock/server/`): FastAPI sync `def` handlers, `session: Session = Depends(get_session)`. 7 routers: `catalog`, `samples`, `pipelines`, `validation`, `jobs`, `files`, `health`. `ValueError` → `HTTPException(400)`. Dual auth: Supabase JWT (`auth.py`, JWKS TTL 1h, `MLBLOCK_DEV_AUTH` bypass) + per-job GPU bearer (`gpu_auth.py`, `instance_api_key` else `GPU_API_KEY`). Tables in `models.py`: `profiles`, `pipelines` (JSON `nodes`/`edges`), `jobs`, `job_outputs` (UUID PKs, FK CASCADE).

- **Bridge** (`backend/mlblock/blocks/registry.py`): `_discover()` at import scans `blocks/{category}-{HEX}/` (e.g. `donnees-22C55E/`, `convolution-6366F1/` — 13 categories, ~111 blocks), `importlib.util.spec_from_file_location` per file, introspects signature + docstring → `BLOCK_REGISTRY` (Pydantic `Block`), `BLOCK_SOURCES` (verbatim source), legacy `BlockRegistry`.

- **Frontend** (`frontend/src/`): `router.tsx` (`createBrowserRouter` + `RequireAuth`, 7 routes), `store/useAppStore.ts` (single Zustand store: `flowNodes`/`flowEdges`, `savedFingerprint` dirty check, undo/redo 50-deep, `loadPipeline`/`savePipeline`/`ensureDraft`), `api/client.ts` (axios + Supabase token interceptor, zod-validated), `utils/typeCheck.ts` + `portResolution.ts` (mirror `core/types.py` — `family_of`, `buildConversionGraph`, `classifyEdge`, `resolveConnection` scoring).

Execution: `save → POST /api/pipelines → POST /{id}/execute` creates `Job` → local subprocess (`MLBLOCK_RUN_MODE=local`, temp file + `BACKEND_URL`/`JOB_ID` env) or Vast dispatch (`gpu`, cheapest offer + `PUT /asks/{id}` with gzip onstart → `PUT /instances/{id}`) → callbacks `POST /api/jobs/{id}/status|output|error` → `jobs`/`job_outputs`. Alt local: `python -m mlblock --mode generate|build` → dummy `torch.randn` forward.

## Key Directories

```
backend/
├── mlblock/
│   ├── core/          # graph.py, pipeline.py, config.py, generator.py, block.py, types.py, vast.py
│   ├── blocks/        # {category}-{HEX}/ — one file per block; registry.py discovers
│   │                  # donnees-22C55E, transformations-F5A623, convolution-6366F1,
│   │                  # normalisation-10B981, activation-EF4444, regroupement-F59E0B,
│   │                  # sequences-8B5CF6, modeles-F59E0B, entrainement-DE497D,
│   │                  # texte-9AA0C4, renforcement-E8C77A, chargement-7C3AED, visualisation-EC4899
│   ├── server/        # main.py (factory), routes.py (7 routers), auth.py, gpu_auth.py,
│   │                  # database.py, models.py, schemas.py, __main__.py
│   ├── models/        # pipeline.py — PipelineDef/Node/Edge (Pydantic v2 validators)
│   ├── configs/       # cnn_mnist.json — reference {graph:{nodes[],edges[]}}; demo-pipelines/ (6 examples)
│   ├── tests/         # 16 pytest files + conftest.py (209 tests) — voir Testing & QA
│   └── scripts/       # generate_samples.py (Supabase Storage CSV + manifest), validate_exercises.py (live API smoke)
├── pyproject.toml     # canonical deps — uv
├── uv.lock            # committed (695KB)
└── requirements.txt   # STALE — adds stable-baselines3, drops torchvision; uv ignores it; never edit
frontend/
└── src/
    ├── api/           # client.ts (axios + zod, toSegments, fetchCatalog)
    ├── components/    # flow/ (FlowCanvas, BlockNode, FlowLink, FlowPalette), ui/, editor/, landing/
    ├── pages/         # EditorPage.tsx (unsaved guard), ProjectsPage, Login/Register, Home/About
    ├── store/         # useAppStore.ts — single source of truth
    ├── schemas/       # api.ts (zod catalog/pipeline/job)
    ├── types/         # catalog.ts (Segment union, BlockDef)
    ├── hooks/         # useBlockRunner, usePipelineImport, useUndoRedo
    └── utils/         # layout.ts (dagre), tapGuard.ts, typeCheck.ts, portResolution.ts,
                       # exportImport.ts, columns.ts, blockHelpers.ts, pending-stash.ts, fingerprint, flowConversion
docs/                  # mlblock_v1.md (canonical spec), routes.md, supabase-auth.md, keep-alive.md, journal-2026-08-03.md, marketing.md
docker-compose.coolify.yml # Coolify stack (backend FastAPI :8000 + frontend :80, healthchecks)
backend/Dockerfile      # python:3.11-slim + uv sync --frozen (prod image)
frontend/Dockerfile     # node:22 + pnpm build, servi par `serve -s dist`
render.yaml             # STALE (pré-Coolify) — ne plus éditer, à supprimer
backend/main.py        # GENERATED code example — not a source file; ignore
```

## Development Commands

Backend from `backend/` with `uv`; frontend from `frontend/` with `pnpm`:

```bash
# Backend
uv sync                                         # install (creates .venv)
uv run python -m mlblock                        # codegen default config (configs/cnn_mnist.json)
uv run python -m mlblock configs/cnn_mnist.json --mode build  # build + dummy forward
uv run python -m mlblock.server                 # uvicorn 127.0.0.1:8000 (or: uv run uvicorn mlblock.server.main:app --reload)
uv run pytest mlblock/tests -q                  # all tests (skips without DATABASE_URL)
uv run pytest mlblock/tests/test_graph.py -q    # single file; -k test_cycle for filter
uv run ruff check .                             # lint (E+F only; E501 ignored in mlblock/blocks/**)
uv run python scripts/generate_samples.py       # upsert French CSVs to Supabase Storage sample-data
uv run python scripts/validate_exercises.py     # live smoke: POST /api/pipelines → /execute → poll /jobs/{id}

# Frontend (no Vite proxy — hits VITE_API_BASE_URL directly)
pnpm install --frozen-lockfile                 # or pnpm install in dev
pnpm dev                                        # Vite dev server
pnpm run build                                  # tsc --noEmit && vite build
pnpm test                                       # vitest run (node env)
pnpm lint                                       # eslint flat, --max-warnings 0
```

CI (`.github/workflows/ci.yml` on push/PR): backend `uv sync --dev` → `ruff check` → `pytest`; frontend `pnpm install --frozen-lockfile` → `build` → `vitest run` → `eslint`. `release-drafter.yml` on push to `main`.

## Code Conventions & Common Patterns

- **Python >=3.10**, `from __future__ import annotations` in core. Pydantic v2 (`BaseModel`, `model_validator`, `Field`); `PipelineDef.model_validate(data, context={"registry": BLOCK_REGISTRY})`.
- **Blocks are plain module-level functions** — no base class. File stem = registration key. Ports as string annotations: `in_1: "torch.Tensor" -> "torch.Tensor"` or `-> tuple["torch.Tensor", "torch.Tensor"]` (→ `out_1`/`out_2`) or `-> dict[str, type]` (named ports). `in_\d+` or data dtype → input; rest → params.
  ```python
  # backend/mlblock/blocks/convolution-6366F1/conv2d.py
  def conv2d(in_1: "torch.Tensor", out_channels: int, kernel_size: int = 3) -> "torch.Tensor":
      """Convolution 2D
      Applique une convolution 2D.
      :param out_channels: nombre de filtres (entre: 1-512, pas: 1)
      :param kernel_size: taille noyau (impair) (choix: 1|3|5|7)
      """
      import torch.nn as nn
      return nn.Conv2d(in_1.shape[1], out_channels, kernel_size)
  ```
- **Docstring contract**: line 1 French label, line 2 French summary; param metadata suffixes parsed by `_extract_param_desc`: `(entre: min-max, pas: x)`, `(impair)`, `(choix: a|b)`, `(suggestions: s1|s2)`, `(format: ...)`, `(longueur: N)`.
- **Import discipline**: `import torch`/`nn` at top fine; `sklearn`/`gymnasium`/`pandas`/`torchvision` lazily inside function body.
- **Error handling**: `ValueError` in core (`Graph.validate`, `ConfigLoader`, `PipelineDef`), `HTTPException(400, detail=str(e))` at FastAPI layer, `NotImplementedError` in `BlockMeta.execute()` if no builder. GPU auth → 403, JWT → 401. Param coercion `TypeError` with French message `Paramètre 'k' du bloc 'n' : 'v' non convertible`.
- **Async**: all sync — routes are `def`, not `async def` (only lifespan is async). Frontend uses `async/await` + TanStack Query.
- **French** in user-facing strings (labels, errors, docstrings), English in code/identifiers.
- **Frontend state**: single Zustand store — never fork. Catalog via TanStack Query → `setCatalog` backfills `segs`/`inputs`/`outputs`. Dirty = `fingerprintOf(state) !== savedFingerprint` (semantic nodes/edges/positions only, ignores `measured`/`selected`).
- **Editor canvas**: free mode only. Tap-to-add mobile-only — desktop palette `onAdd` inert; mobile drawer passes `onAdd`. Handles ≥22px via `@media (pointer: coarse)` in `@layer utilities`. "Disposer" is `ControlButton` inside `<Controls>` — explicit `commitUndoPoint()` then `arrangeGraph()` (dagre TB ranksep 80/nodesep 50, center→top-left), never auto-run. `FlowCanvas.onConnect` scoring: exact 3 > wildcard/family 2 > convertible 1; compatible → replace edge, convertible → `converterFor` toast.
- **Frontend forms**: RHF + zod only on auth pages (`Controller` + `zodResolver`); editor params are segment-driven (`BlockSegments` rendering `toSegments` union: `file`/`bool`/`sel`/`sug`/`list`/`num`).
- **Unsaved-changes guard**: `useBlocker(() => isDirty())` in `EditorPage` + Base UI `UnsavedChangesDialog` + `beforeunload` + `localStorage` stash `mlblock-pending-{userId}` — don't regress.
- **Payloads**: canvas→backend always via `pipelineDocument.toServerPayload()` (never raw ReactFlow JSON — drops container hierarchies).
- **Theme**: dark canvas (`data-theme="dark"`), tokens only (`shadcn/no-raw-colors`, no raw palette).

## Important Files

| File | Role |
|---|---|
| `backend/mlblock/server/main.py` | FastAPI factory — `load_dotenv()` before internal imports, CORS from `CORS_ORIGINS`, includes 7 routers |
| `backend/mlblock/__main__.py` | CLI: `python -m mlblock [config] --mode generate|build` (default `configs/cnn_mnist.json`) |
| `backend/mlblock/server/__main__.py` | `python -m mlblock.server` → uvicorn 127.0.0.1:8000 |
| `backend/mlblock/blocks/registry.py` | Import-time discovery — `BLOCK_REGISTRY`, `BLOCK_SOURCES`, param/type parsing |
| `backend/mlblock/core/pipeline.py` | `Pipeline.run()` / `generate_code()` orchestration, `_value_for` |
| `backend/mlblock/core/generator.py` | `CodeGenerator` — standalone script with notify/_self_destroy, `_serialize_output` |
| `backend/mlblock/core/config.py` | `ConfigLoader.load/validate` — JSON → Graph (JSON-only, rejects .yaml) |
| `backend/mlblock/core/graph.py` | `Graph` Kahn sort, `GraphNode`/`Edge`, cycle detection |
| `backend/mlblock/core/types.py` | `family_of`, `build_conversion_graph` (transformations only), `classify` |
| `backend/mlblock/validation.py` | Kahn sort, cycle detection, stage transitions, port compatibility |
| `backend/mlblock/execution.py` | Local/Vast backends, uv images + bootstrap builder, orphan policy |
| `backend/mlblock/core/vast.py` | `VastAI` REST client (bundles/asks/instances, gzip+base64 onstart) |
| `backend/mlblock/core/block.py` | `BlockMeta`/`BlockRegistry`, `_coerce_param_value`, `_extract_param_desc` |
| `backend/mlblock/models/pipeline.py` | `PipelineDef` validators (registry, port existence, dtype compatibility) |
| `backend/mlblock/server/models.py` | SQLModel tables: `profiles`, `pipelines` (JSON nodes/edges), `jobs`, `job_outputs` |
| `backend/mlblock/server/schemas.py` | Pydantic `Block`/`Category`/`ParamInfo`/`PipelineCreate`/`JobStatusUpdate` |
| `backend/mlblock/server/auth.py` / `gpu_auth.py` | JWT (JWKS 1h cache, HS256/RS256) / per-job GPU bearer |
| `backend/mlblock/server/database.py` | Engine pool 20/10 + `get_session` generator + `init_db` |
| `backend/mlblock/configs/cnn_mnist.json` | Reference config `{graph:{nodes[],edges[]}}` — node `{id,type,params,ports{in/out}}`, edge `{source,source_port,target,target_port}` |
| `backend/scripts/generate_samples.py` | Idempotent Supabase Storage upserter — 6 CSVs (immo/ventes/etudiants/clients/meteo/trafic) + manifest |
| `backend/scripts/validate_exercises.py` | Live smoke — 6 exercises via `POST /api/pipelines` → `/execute` → poll `GET /api/jobs/{id}` |
| `frontend/src/router.tsx` | `createBrowserRouter` + `RequireAuth` (7 routes) |
| `frontend/src/store/useAppStore.ts` | Zustand store — canvas state, fingerprint, undo/redo, `loadPipeline`/`savePipeline` |
| `frontend/src/api/client.ts` | Axios + Supabase interceptor + zod (`toSegments`, `fetchCatalog`, `validateGraph`, `executePipeline`) |
| `frontend/src/utils/layout.ts` | `arrangeGraph()` — dagre TB ranksep 80/nodesep 50, center→top-left |
| `frontend/src/utils/tapGuard.ts` | `shouldIgnoreTap` — 8px drag threshold |
| `frontend/src/utils/typeCheck.ts` / `portResolution.ts` | Frontend type system + connection scoring (mirrors `core/types.py`) |
| `frontend/src/utils/pending-stash.ts` | `localStorage` stash `mlblock-pending-{userId}` for unsaved work |
| `frontend/.env.example` | `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `backend/.env.example` | `DATABASE_URL` (pooler `:6543`, % encoding), `SUPABASE_*`, `VAST_API_KEY`, `BACKEND_URL`, `GPU_API_KEY` |

Backend env: `DATABASE_URL`, `SUPABASE_URL`/`PUBLISHABLE_KEY`/`SECRET_KEY`/`JWKS_URL`/`JWT_SECRET`, `VAST_API_KEY`, `BACKEND_URL`, `GPU_API_KEY`, `CONTAINER_API_KEY`/`JOB_ID`/`BACKEND_TIMEOUT` (90s)/`MLBLOCK_GPU_TIMEOUT` (1800s), `MLBLOCK_RUN_MODE=local|gpu`, `MLBLOCK_DEV_AUTH`, `CORS_ORIGINS`.

## Runtime/Tooling Preferences

- **Backend**: `uv` only (`uv.lock` committed, `pyproject.toml` canonical). Python `>=3.10` declared, **3.11** pinned in prod (`backend/Dockerfile: python:3.11-slim-bookworm`) and CI (`setup-uv python 3.11`). No `[project.scripts]`, no `.python-version`. `requirements.txt` is stale — never edit as source of truth. `ruff` target `py310`, `E+F` only, `E501` ignored for `mlblock/blocks/**` (line-length 120).
- **Frontend**: `pnpm@9.15.4` only (`pnpm-lock.yaml`; no `npm`/`bun`/`yarn`). Node **>=20** (22 recommended). React 19 + `@xyflow/react` 12. Build = `tsc --noEmit && vite build`. Test = `vitest run` node env — no jsdom, no `@testing-library`. Key deps: `zustand`, `@tanstack/react-query`, `@dagrejs/dagre`, `axios`, `zod`, Tailwind v4 (`@theme` in `index.css` mirrored in `theme.ts`), Base UI.
- **No Vite proxy**: frontend hits `VITE_API_BASE_URL` directly (`http://localhost:8000` in `frontend/.env` for dev; Coolify bakes prod URL at build via `VITE_API_BASE_URL` build arg).
- **tsconfig**: `strict: true`, `moduleResolution: bundler`, `noEmit`, no path aliases, `skipLibCheck`.
- **DB**: real PostgreSQL required — **no SQLite fallback** in server (tests `pytest.skip` without it). Use Supabase pooler `:6543` transaction mode, IPv4, percent-encode pooler password (`?`→`%3F`, `@`→`%40`, `*`→`%2A`). Free-tier project can pause (DB timeouts while auth looks healthy).
- **Coolify** (`docker-compose.coolify.yml`, VPS Oracle ARM64) : backend `backend/Dockerfile` (uv sync --frozen → uvicorn `:8000`, `/healthz`) ; frontend `frontend/Dockerfile` (pnpm build avec `VITE_API_BASE_URL` en build-arg → `serve -s dist :80`). Auto-redeploy sur push `main` via webhook (`.github/workflows/deploy-coolify.yml`, après CI verte). Détail : `docs/coolify/coolify-deployment.md`. Prod `MLBLOCK_RUN_MODE=gpu`, `BACKEND_URL` = URL backend publique (callbacks Vast).

## Testing & QA

- **Backend — pytest 9 + httpx `TestClient`** (no `tool.pytest` config — default discovery; run `uv run pytest mlblock/tests -q` from `backend/`):
  ```bash
  uv run pytest mlblock/tests -q
  uv run pytest mlblock/tests/test_graph.py -q -k test_cycle
  uv run ruff check .
  ```
  16 files + `conftest.py` (209 tests, verified 2026-10-14): graph, block, config, pipeline, types, server, auth, validation, stages, runtime-codegen, file-assets, three-stage, type-system, audit-coverage, exos, execution.

- **Frontend — vitest 3** (`vitest run`, node env, no jsdom/coverage; `vite.config.ts` doubles as vitest config):
  ```bash
  pnpm test                           # vitest run
  pnpm run build                      # type-check + bundle (must pass)
  pnpm lint                           # --max-warnings 0
  ```
  17 files / 135 tests in `src/**/*.test.ts` (verified 2026-10-14): `useAppStore` (fingerprint, `isDirty`, undo/redo cap 50), `layout`, `tapGuard`, `portResolution`, `typeCheck`, `exportImport`, `outputCodec` (gzip roundtrip), stages, catalog-parse, files, auth.

- **DB/auth strategy** (`conftest.py`): `load_dotenv()` before internal imports (required — `auth.py` reads env at import). Two fixtures: `catalog_client` (no DB, no auth, for `/api/catalog`) and `client` (real `DATABASE_URL` engine, `statement_timeout=10000`, `StaticPool`). Skips gracefully if `DATABASE_URL`/`SUPABASE_URL`/`SECRET_KEY` unset. Per-test purge via `DELETE FROM pipelines WHERE user_id=…`. Auth mocked via `app.dependency_overrides` (`get_current_user`→UUID, `verify_gpu_key`→`"gpu"`); `test_auth.py` uses its own `sqlite://` + live Supabase Admin API (`POST /auth/v1/admin/users`, `email_confirm:true`) to exercise JWT. `validate_exercises.py` runs live smoke against `http://localhost:8000` with `SMOKE_JWT`.

- **Coverage**: registry, config, graph/topo, codegen text, type/port system, param metadata, pipeline CRUD/drafts/limits, validate/generate/build, jobs + GPU callbacks, samples manifest, real JWT, dagre layout, tap guard. **Gaps**: VastAI client (only `FakeVast`), real GPU execution/timeouts, Storage downloads, frontend components/hooks, Supabase UI auth flows, no coverage report.

- **Gotchas**: `mlblock/__init__.py` triggers discovery on any `import mlblock` — touches `DATABASE_URL` if set. `BlockRegistry` is class-level global — test-registered blocks (`src2`, `coerce_test`) persist across files. Test user is global singleton — `pytest -n` would race. No `testpaths`/env injection — must run from `backend/` with `uv run`.
