# Repository Guidelines

## Project Overview

MLBlock is a visual, no-code block DAG builder for Machine Learning (ML), Deep Learning (DL), and Reinforcement Learning (RL), designed as an educational and prototyping platform ("Scratch for ML"). Users assemble processing graphs on a React-based node canvas, which are validated, compiled into standalone executable Python code by a FastAPI backend, and executed locally or dispatched to on-demand Vast.ai GPU instances with real-time logging and metric reporting.

---

## Architecture & Data Flow

```
[React Canvas: ReactFlow + Zustand]
             │
             │ (JSON Graph: nodes & edges)
             ▼
[FastAPI Backend: /api/validate] ──> Kahn Topo Sort & Dtype Compatibility Check
             │
             │ (Valid Graph)
             ▼
[FastAPI Backend: /api/pipelines/{id}/build] ──> Codegen (Generator inlines block code)
             │
             │ (Standalone Python script with status/output callbacks)
             ▼
[FastAPI Backend: /api/pipelines/{id}/execute] ──> Creates Job row in DB
             │
      ┌──────┴─────────────────────────────────┐
      │ (MLBLOCK_RUN_MODE=local)               │ (MLBLOCK_RUN_MODE=gpu)
      ▼                                        ▼
[Local Subprocess (Popen)]            [Vast.ai REST API]
                                               │ (rents GPU instance, passes
                                               │  onstart script with instance_api_key)
                                               ▼
                                      [Remote GPU Container]
      │                                        │
      └──────────────────┬─────────────────────┘
                         │ HTTP POST /api/jobs/{id}/status & /output
                         ▼
        [FastAPI Backend: Writes JobOutput rows]
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Supabase Realtime]               [Frontend Polling]
(postgres_changes INSERT)         (fallback: 3s status / 2s outputs)
        └────────────────┬────────────────┘
                         ▼
        [Frontend Zustand Store (jobOutputs)] ──> Canvas Node States & Console
```

### Key Modules & Subsystems

1. **Block Discovery & Catalog (`backend/mlblock/blocks/registry.py`, `catalog.py`)**:
   - Blocks are standalone Python functions stored in `blocks/{category}-{HEXCOLOR}/*.py`.
   - On backend import, `_discover()` dynamically scans directories and loads modules via `importlib.util.spec_from_file_location` (accommodating hyphens in directory names).
   - Functions are registered into `BLOCK_REGISTRY` and indexed by file stem (e.g. `load_csv`).
   - A singleton `Catalog` facade (`backend/mlblock/catalog.py`) provides query and snapshot access for API routers.

2. **Validation & Type System (`backend/mlblock/validation.py`, `backend/mlblock/core/types.py`)**:
   - Single source of truth for graph integrity.
   - Runs Kahn's topological sort algorithm to detect cycles and build execution sequence.
   - Validates port connections and data type compatibility (`compatible`, `convertible`, `incompatible`) using a conversion graph generated exclusively from `transformations-*` blocks.

3. **Code Generation (`backend/mlblock/core/generator.py`)**:
   - Translates validated graph JSON into a self-contained, standalone Python script.
   - Inlines block source code directly from discovery registry without requiring external dependencies at runtime.
   - Injects execution helpers (`notify_status`, `notify_output`, `notify_error`) posting back to `/api/jobs/{id}/...` with a 20KB output truncation threshold.

4. **Execution Adapters (`backend/mlblock/execution.py`, `backend/mlblock/core/vast.py`)**:
   - `LocalBackend`: Spawns local subprocess via `Popen` writing to temporary files.
   - `VastBackend`: Interacts with Vast.ai REST endpoints (`POST /bundles`, `PUT /asks/{id}`) without SSH; launches GPU instances with base64/gzip-compressed `onstart` startup scripts.
   - Switched via `MLBLOCK_RUN_MODE` (`local` vs `gpu`). A mock key (`mock-*`) automatically forces local mode.

5. **Frontend Canvas & State (`frontend/src/store/useAppStore.ts`, `frontend/src/components/flow/`)**:
   - Single Zustand store manages `flowNodes` and `flowEdges` as canvas truth.
   - Pure document helpers (`pipelineDocument.ts`) maintain a 50-step undo/redo stack and compute a deterministic JSON `savedFingerprint` for dirty tracking.
   - `useBlockRunner.ts` orchestrates the end-to-end execution flow: validate -> save draft -> build -> execute -> listen via Supabase Realtime channel + polling fallbacks.

---

## Key Directories

```
.
├── backend/
│   ├── mlblock/
│   │   ├── blocks/            # Categorized block definitions ({category}-{HEXCOLOR}/*.py)
│   │   ├── core/              # Pipeline engine: block runtime, codegen, types, Vast.ai client
│   │   ├── models/            # Pydantic graph models (nodes, edges, pipeline definitions)
│   │   ├── server/            # FastAPI app: routes, database, models, auth, schemas
│   │   └── tests/             # Pytest test suites (unit + integration)
│   └── scripts/               # Operational utilities (generate_samples.py, validate_exercises.py)
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client, Supabase JWT interceptor, Zod schemas
│   │   ├── components/        # React components (flow canvas, node cards, layout controls)
│   │   ├── content/cours/     # Zod-validated Markdown courses & expected graph definitions
│   │   ├── hooks/             # Custom hooks (useBlockRunner, useAuth, useTheme)
│   │   ├── pages/             # Route views (EditorPage, CoursesPage, Auth pages)
│   │   ├── routes/            # TanStack Router file routes
│   │   ├── store/             # Zustand stores (useAppStore.ts, pipelineDocument.ts)
│   │   └── utils/             # Graph logic (portResolution, typeCheck, layout, connection)
│   └── scripts/               # Build-time SEO & meta generators (generate-seo.mjs)
├── tutos/                     # Learner-facing French walkthrough guides
├── docs/                      # Technical specifications, keep-alive docs, and auth setup notes
└── .github/workflows/         # CI/CD workflows (ci.yml, release-drafter.yml)
```

---

## Development Commands

### Backend (`backend/`)

Managed via `uv` only. Run all commands from the `backend/` directory:

```bash
# Environment setup
uv sync                          # Install dependencies into .venv
uv sync --dev                    # Install dependencies including test/lint tools

# Run development server
uv run uvicorn mlblock.server.main:app --reload --port 8000

# Standalone CLI execution
uv run python -m mlblock --mode generate                  # Codegen from default configs/cnn_mnist.json
uv run python -m mlblock configs/cnn_mnist.json --mode build # Build and execute pipeline in-process

# Code quality
uv run ruff check .              # Lint Python code (E and F rules; blocks exempt from E501)

# Testing
uv run pytest mlblock/tests -q                     # Run all backend tests quietly
uv run pytest mlblock/tests/test_graph.py -v       # Run a specific test file
uv run pytest mlblock/tests -k "test_catalog"      # Run tests matching expression
```

### Frontend (`frontend/`)

Managed via `pnpm` only. Run all commands from the `frontend/` directory:

```bash
# Environment setup
pnpm install                     # Clean install dependencies (or pnpm install --frozen-lockfile)

# Run development server
pnpm run dev                     # Start Vite dev server (direct backend access on VITE_API_BASE_URL)

# Build & Quality checks
pnpm run build                   # Runs `tsc --noEmit && vite build && node scripts/generate-seo.mjs`
pnpm run lint -- --max-warnings 0 # ESLint check; CI requires zero warnings
pnpm test                        # Run Vitest test runner (store & util logic)
pnpm run knip                    # Check for unused exports and dependencies
```

---

## Code Conventions & Common Patterns

### Python Backend & Block Authoring

- **Block Signatures**: Blocks are pure Python functions without base classes. Input parameters representing data connections MUST be prefixed with `in_` (e.g. `in_1: "torch.Tensor"`). Standard parameters define node options.
- **Block Typing**: Use string annotations for port types (`"torch.Tensor"`, `"pd.DataFrame"`, `"sklearn.base.ClassifierMixin"`).
- **Block Docstrings**: Required 2-line format in French:
  - Line 1: Human-readable block label.
  - Line 2: Brief summary of block purpose.
  - Parameter constraints formatted in parentheses: `(entre: min-max, pas: x)`, `(choix: opt1|opt2)`, `(format: ext)`.
- **Block Imports**: Top-level imports restricted to standard library and lightweight packages (`torch`, `torch.nn`). Heavy libraries (`pandas`, `sklearn`, `gymnasium`) MUST be imported inside the block function body to prevent slow discovery startup.
- **Python Imports**: Always include `from __future__ import annotations`.
- **FastAPI Endpoints (`backend/mlblock/server/routes.py`)**:
  - Route handlers are declared as synchronous `def` functions (not `async def`) because database queries use synchronous SQLModel/psycopg2 sessions.
  - Dependency injection handles sessions and auth: `session: Session = Depends(get_session)`, `user_id: str = Depends(get_current_user)`, `job: Job = Depends(verify_gpu_key)`.
  - Input validation errors are raised as `HTTPException(status_code=400, detail=str(e))`.

```python
# Example Block: backend/mlblock/blocks/donnees-22C55E/load_csv.py
from __future__ import annotations

def load_csv(path: "file" = "data.csv") -> "pd.DataFrame":
    """Charger un fichier CSV
    Charge un tableau de données tabulaires depuis un fichier local ou Supabase Storage.
    path: Chemin du fichier CSV (format: .csv)
    """
    import pandas as pd
    return pd.read_csv(path)
```

### TypeScript Frontend & Canvas

- **State Integrity**:
  - Never bypass or duplicate `frontend/src/store/useAppStore.ts`.
  - `flowNodes` and `flowEdges` drive ReactFlow; conversions between ReactFlow shapes and server JSON shapes pass through pure converters in `frontend/src/store/pipelineDocument.ts`.
  - The canvas operates strictly in free-form mode. Never reintroduce fixed grid constraints or auto-layout on node drop. Dagre layout is manually triggered via the "Disposer" button.
- **Component Styling**:
  - Uses Astryx Design System (`@astryxdesign/core`) paired with `@stylexjs/stylex` and Tailwind CSS v4.
  - Cascade layer hierarchy defined in `frontend/src/index.css`: `@layer reset, theme, base, astryx-base, astryx-theme, components, utilities;`.
  - Dark mode is enforced globally via `data-theme="dark"`.
- **API & Validation**:
  - Direct Axios client in `frontend/src/api/client.ts` attaches Supabase access token via request interceptors.
  - Response payloads validated using Zod schemas (`parseOrThrow`).
  - React Hook Form + Zod restricted to standalone authentication forms; editor canvas uses segment-driven parameter controls on `BlockNode`.
- **Unsaved Changes Guard**:
  - Uses `@tanstack/react-router` `useBlocker` and browser `beforeunload` events to detect changes against `savedFingerprint`. Pending changes are preserved in `localStorage` under `mlblock-pending-{userId}`.

---

## Important Files

### Configuration & Infrastructure
- `backend/pyproject.toml` — Canonical backend dependency definitions, Python compatibility, and Ruff linting rules.
- `frontend/package.json` — Frontend dependencies and pnpm build/lint/test scripts.
- `frontend/vite.config.ts` — Vite configuration supporting SPA dev routing and TanStack Start SSG production builds.
- `render.yaml` — Blueprint deployment configuration for Render (FastAPI web service + static frontend).
- `.github/workflows/ci.yml` — Primary CI pipeline enforcing linting and test passes.

### Core Backend Modules
- `backend/mlblock/blocks/registry.py` — Dynamic block discovery engine scanning filesystem categories.
- `backend/mlblock/catalog.py` — Unified catalog facade bridging block discovery to API routers.
- `backend/mlblock/validation.py` — Graph topological validation and type-family checking.
- `backend/mlblock/core/generator.py` — Code generation engine compiling DAGs into standalone Python scripts.
- `backend/mlblock/execution.py` & `backend/mlblock/core/vast.py` — Execution dispatchers for local subprocesses and Vast.ai instances.
- `backend/mlblock/server/main.py` & `backend/mlblock/server/routes.py` — FastAPI application root, CORS configuration, and route handlers.
- `backend/mlblock/server/models.py` & `database.py` — SQLModel table definitions (`Pipeline`, `Job`, `JobOutput`) and DB session factory.
- `backend/mlblock/server/auth.py` & `gpu_auth.py` — Supabase JWT verification and GPU worker bearer-token authentication.

### Core Frontend Modules
- `frontend/src/main.tsx` & `frontend/src/router.tsx` — TanStack Router initialization and application bootstrap.
- `frontend/src/store/useAppStore.ts` — Central Zustand state store managing canvas nodes, edges, history, and job outputs.
- `frontend/src/store/pipelineDocument.ts` — Pure graph transformation, undo history management, and fingerprinting logic.
- `frontend/src/components/flow/FlowCanvas.tsx` — Main ReactFlow canvas provider, connection resolver, and converter-node injector.
- `frontend/src/components/flow/BlockNode.tsx` — Custom ReactFlow node component rendering Astryx cards and parameter controls.
- `frontend/src/hooks/useBlockRunner.ts` — Pipeline run orchestration, status polling, and Supabase Realtime listener.
- `frontend/src/api/client.ts` — Typed HTTP client with auth injection and Zod validation.
- `frontend/src/index.css` — Core stylesheet declaring Tailwind v4 `@theme` tokens, StyleX bindings, and layer order.

---

## Runtime/Tooling Preferences

- **Python Runtime & Tooling**:
  - Python >= 3.10 required (3.11 used in CI and Render production).
  - Package manager: **`uv` ONLY**. Lockfile `backend/uv.lock` is committed.
  - **CRITICAL**: Do NOT use `pip` directly; legacy `backend/requirements.txt` has been removed. Always use `uv sync` and `uv run`.
- **Node Runtime & Tooling**:
  - Node.js version 22 (as configured in CI and container builds).
  - Package manager: **`pnpm` ONLY** (`pnpm-lock.yaml` is committed).
  - **Strict Tooling Ban**: Do NOT use `npm`, `yarn`, or `bun`. Do not introduce `.nvmrc`.
- **TypeScript & Build**:
  - TypeScript in `strict` mode with `moduleResolution: bundler`.
  - No path aliases: all imports use relative paths (e.g. `../../store/useAppStore`).
  - No monorepo orchestration tools: backend and frontend are maintained as independent root directories.
  - No Docker / docker-compose configurations in repo; deployments run directly on Render native runtimes.

---

## Testing & QA

### Backend (`pytest`)
- Test suites reside in `backend/mlblock/tests/`.
- **Pure Unit Tests**:
  - `test_graph.py`, `test_config.py`, `test_types.py`, `test_validation.py`, `test_pipeline.py`, `test_block.py`.
  - Run completely in-memory with zero database or external network requirements.
- **Integration & API Tests**:
  - `test_server.py`, `test_auth.py`.
  - `catalog_client` fixture tests catalog endpoints without DB access.
  - `client` fixture connects to a live PostgreSQL database via Supabase pooler (`DATABASE_URL`). There is **NO SQLite fallback** for integration tests.
  - Tests gracefully skip in CI if `DATABASE_URL` or Supabase secrets are missing.
  - Test suites provision a dedicated user via Supabase Admin API and cascade-purge that user's pipelines/jobs after each test.
  - `BlockRegistry` maintains class-level state in-memory across test runs; ensure mock blocks do not leak.

### Frontend (`Vitest`)
- Test suites reside in `frontend/src/store/*.test.ts` and `frontend/src/utils/*.test.ts`.
- **Environment**: Default Node.js environment (no `jsdom` or `happy-dom`).
- Tests cover pure algorithmic and state logic: Zustand store mutations, fingerprint dirty tracking, Dagre layout calculations, port resolution scoring, edge type-checking, and export/import serialization.
- React components and TanStack route definitions are intentionally excluded from unit testing.

### CI/CD Pipeline (`.github/workflows/ci.yml`)
- Triggered on all `push` and `pull_request` events.
- Employs concurrency group `ci-${{ github.ref }}` with `cancel-in-progress: true`.
- **Backend Job**: Sets up Python 3.11 with `setup-uv`, verifies dependencies with `uv sync --dev`, runs `uv run ruff check .`, and executes `uv run pytest mlblock/tests -q`.
- **Frontend Job**: Sets up Node 22 with `pnpm/action-setup@v4`, runs `pnpm install --frozen-lockfile`, verifies build with `pnpm run build`, executes `pnpm test`, and runs `pnpm run lint -- --max-warnings 0`.

---

## Environment Variables & Critical Gotchas

- **Supabase Database Connection**:
  - `DATABASE_URL` must point to the Supabase pooler on port `6543` in transaction mode (IPv4).
  - Special characters in passwords must be percent-encoded (`?` -> `%3F`, `@` -> `%40`, `*` -> `%2A`).
  - Inactive free-tier Supabase databases pause automatically, leading to backend DB timeouts while auth endpoints appear healthy.
- **Vite Direct API Calls**:
  - Vite runs without a reverse proxy. Frontend makes direct cross-origin requests to `VITE_API_BASE_URL` (configured locally as `http://localhost:8000`). Backend must configure `CORS_ORIGINS` accordingly.
- **Prerendering & Supabase Credentials**:
  - Production frontend build executes TanStack Start prerendering (`vite build`), requiring placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in headless environments.
- **Execution Run Mode**:
  - `MLBLOCK_RUN_MODE` defaults to `local` in development and `gpu` in production.
  - If `VAST_API_KEY` begins with `mock-`, execution automatically falls back to local subprocess mode.
- **Generated Files to Ignore**:
  - `backend/main.py` is a generated codegen artifact and should not be edited or committed.
