# Repository Guidelines

## Project Overview

`mlblock` is a visual no-code DAG builder for ML, DL, and RL prototyping ("Scratch for ML"). The system compiles user-assembled computational graphs into reproducible, standalone Python scripts. It consists of:
- **Backend**: FastAPI, SQLModel, PyTorch, and a dynamic block discovery system.
- **Frontend**: React 19, Vite, TanStack Router / TanStack Start, ReactFlow, and Zustand.
- **Execution Engine**: Dual-mode runner supporting local subprocesses (`Popen`) or remote GPU orchestration (Vast.ai REST) with streaming output callbacks via Supabase Realtime CDC.

Strict domain vocabulary is enforced across all documentation, commits, and code:
- **Block**: Reusable executable Python unit (`in_` ports, docstring metadata). *Forbidden: Bloc, Component, Service.*
- **Catalog**: Dynamic discovery and indexing module for blocks. *Forbidden: Registry, BlockRegistry.*
- **Pipeline**: Directed acyclic graph of placed blocks and typed edges. *Forbidden: Graph, DAG, Workflow.*
- **Job**: Execution instance of a pipeline. *Forbidden: Run, Execution, Task.*
- **Stages**: AI stages organized as `S0 Ingest`, `S1 Prepare`, `S2 Represent` (S2A DL / S2B ML), `S3 Train` (S3A DL / S3B ML), `S4 Eval`, and `SX World` (isolated RL environment).

---

## Architecture & Data Flow

```
   [ ReactFlow Canvas ]
            │
   useAppStore.ts (flowNodes, flowEdges)
            │
   pipelineDocument.toServerPayload()
            │ (HTTP POST /api/validate & /api/pipelines)
            ▼
   FastAPI Server (server/routes.py)
            │
   Kahn's Topological Sort & Validation (validation.py)
            │
   Code Generator (core/generator.py) ──> Standalone Python Script
            │
   Execution Runner (Local Popen / Vast.ai GPU)
            │
   Callbacks (POST /api/jobs/{id}/output & /status)
            │
   Supabase Postgres (job_outputs table)
            │
   Frontend Realtime CDC Subscription (useBlockRunner.ts)
```

### Key Modules
1. **Catalog & Block Discovery** (`backend/mlblock/catalog.py`, `backend/mlblock/blocks/registry.py`): Scans `backend/mlblock/blocks/{category}-{HEXCOLOR}/` folders dynamically. Parses Python type annotations and French docstrings on the fly without importing heavy dependencies.
2. **DAG Validation** (`backend/mlblock/validation.py`): Performs Kahn's topological sort, cycle detection, stage transition validation, and port type matching.
3. **Standalone Generator** (`backend/mlblock/core/generator.py`): Compiles pipeline nodes and connections into an executable, self-contained Python script with telemetry callbacks and output serialization.
4. **Canvas State & Serialization** (`frontend/src/store/useAppStore.ts`, `frontend/src/store/pipelineDocument.ts`): Manages ReactFlow nodes/edges, 50-step undo/redo stack, and semantic dirty fingerprinting (`fingerprintOf`).
5. **Symmetrical Type System** (`backend/mlblock/core/type_system.py`, `frontend/src/utils/typeCheck.ts`): Backend and frontend implement identical edge classification logic (`classifyEdge` / `classify`) returning `'compatible'`, `'convertible'`, or `'incompatible'`, along with adapter suggestions.

---

## Key Directories

```
mlblock/
├── backend/
│   ├── mlblock/
│   │   ├── blocks/            # Pure Python block functions in {category}-{HEXCOLOR}/
│   │   ├── core/              # Code generator, type system facade, edge types
│   │   ├── server/            # FastAPI app, routes, SQLModel models, schemas
│   │   ├── tests/             # Pytest unit and integration test suites
│   │   ├── catalog.py         # Catalog singleton and snapshot manager
│   │   └── validation.py      # Kahn's sort, graph validation, port compatibility
│   └── pyproject.toml         # Python packaging, uv config, Ruff settings
├── frontend/
│   ├── src/
│   │   ├── components/flow/   # ReactFlow canvas, BlockNode, SuperBlockNode, FlowLink
│   │   ├── routes/            # TanStack Router file-based routes
│   │   ├── store/             # Zustand store (useAppStore.ts) & pipelineDocument.ts
│   │   ├── utils/             # Symmetrical typeCheck.ts, shapeTracker.ts, API client
│   │   ├── main.tsx           # React application shell entry point
│   │   └── router.tsx         # TanStack Router route tree definition
│   └── package.json           # Frontend dependencies, scripts, pnpm configuration
├── docs/                      # ADRs (docs/adr/), domain specs, triage guides
└── CONTEXT.md                 # Project domain glossary and design invariants
```

---

## Development Commands

### Backend (`backend/`)
- **Install dependencies**: `uv sync --dev`
- **Start dev server**: `uv run uvicorn mlblock.server.main:app --reload --port 8000`
- **Lint code**: `uv run ruff check .`
- **Format code**: `uv run ruff format .`
- **Run all tests**: `uv run pytest mlblock/tests -q`
- **Run specific test file**: `uv run pytest mlblock/tests/test_validation.py -v`

### Frontend (`frontend/`)
- **Install dependencies**: `pnpm install --frozen-lockfile`
- **Start dev server**: `pnpm dev`
- **Typecheck**: `pnpm exec tsc --noEmit`
- **Lint code**: `pnpm exec eslint . --max-warnings 0`
- **Run unit tests**: `pnpm test`
- **Production build**: `pnpm run build`

### Full-Stack Docker
- **Build and start services**: `docker compose up --build`

---

## Code Conventions & Common Patterns

### Backend Blocks (`backend/mlblock/blocks/`)
- **Pure Functions**: Write block definitions as standalone pure functions using `from __future__ import annotations`. Never use inheritance or base classes.
- **Port Naming & Typing**: Input ports MUST use the `in_` prefix with string annotations (e.g., `in_1: "Tensor"`).
- **Deferred Imports**: NEVER import heavy libraries (`torch`, `pandas`, `sklearn`, `gymnasium`) at module top-level. Import them inside the function body so catalog scans remain sub-second:
  ```python
  from __future__ import annotations

  def train_model(in_data: "DataFrame", epochs: int = 10) -> "Model":
      """Entraînement de Modèle
      Entraîne un classifieur supervisé.
      (entre: 1-100, pas: 1)
      """
      import torch
      # Implementation...
  ```
- **Docstrings (FR)**: Line 1 is the French label; Line 2 is the French summary; parameter constraints follow the exact syntax: `(entre: min-max, pas: x)`, `(choix: a|b)`, `(format: .csv)`.

### FastAPI Handlers & Dependency Injection (`backend/mlblock/server/routes.py`)
- Route handlers are synchronous `def` functions utilizing SQLModel sync sessions.
- Inject database sessions using `session: Session = Depends(get_session)`.
- Enforce authentication using `user: User = Depends(get_current_user)`.

### Frontend State & Canvas Invariants (`frontend/src/store/`)
- **Single Source of Truth**: NEVER bypass `useAppStore.ts`. All canvas node and edge mutations must go through the store's action dispatches.
- **Payload Serialization**: ALWAYS convert ReactFlow graphs to backend payloads using `pipelineDocument.toServerPayload(nodes, edges)`. Direct JSON serialization drops container and child node hierarchies.
- **Dirty Tracking**: Use `pipelineDocument.fingerprintOf(nodes, edges)` to detect structural changes while ignoring transient viewport, dragging, or selection events.
- **Styling**: Tailwind CSS v4, Astryx, and StyleX. Canvas operates with an enforced dark theme (`data-theme="dark"`). Strict Shadcn linting rules forbid raw color literals (`shadcn/no-raw-colors`).

---

## Important Files

| File | Purpose |
|------|---------|
| `backend/mlblock/server/main.py` | FastAPI application setup, CORS middleware, and API router mounting. |
| `backend/mlblock/server/routes.py` | Synchronous REST endpoints for catalog, pipelines, validation, jobs, and files. |
| `backend/mlblock/catalog.py` | Deep module managing block indexing, snapshot cache, and catalog search. |
| `backend/mlblock/blocks/registry.py` | Filesystem scanner parsing block docstrings and AST metadata. |
| `backend/mlblock/validation.py` | Authoritative pipeline validator, cycle detector, and Kahn DAG topological sorter. |
| `backend/mlblock/core/generator.py` | Standalone Python script compiler for pipeline DAG execution. |
| `backend/main.py` | **Generated artifact** created during local run tests — **NEVER edit or commit**. |
| `frontend/src/main.tsx` | Frontend React application entry point. |
| `frontend/src/store/useAppStore.ts` | Global Zustand state store for canvas state, execution, and active pipeline. |
| `frontend/src/store/pipelineDocument.ts` | Pure data converters, undo/redo stack (50 levels), and dirty fingerprinting. |
| `frontend/src/utils/typeCheck.ts` | Client-side port type compatibility check and adapter suggestion logic. |
| `CONTEXT.md` | Domain glossary, architectural constraints, and stage transition rules. |

---

## Runtime & Tooling Preferences

- **Backend Runtime & Tooling**:
  - Python >= 3.10 (3.11 recommended).
  - **`uv` is mandatory** in `backend/` (`uv sync`, `uv run`). Never invoke `pip` directly or manage manual virtual environments.
  - **Ruff**: Configured in `pyproject.toml` with `line-length = 120`. Line length rule (`E501`) is specifically ignored in `backend/mlblock/blocks/` due to DSL docstrings.
- **Frontend Runtime & Tooling**:
  - Node.js >= 22.
  - **`pnpm@9.15.4` is mandatory** in `frontend/`. Never use `npm`, `yarn`, or `bun`.
  - **ESLint v9 Flat Config**: Uses `@shadcn/lint` rules.
- **Database & Supabase Connection**:
  - `DATABASE_URL` must connect to the Supabase pooler on port `:6543` in transaction mode.
  - Passwords with special characters MUST be percent-encoded (`?` -> `%3F`, `@` -> `%40`, `*` -> `%2A`).
- **Execution Run Modes**:
  - Switch via `MLBLOCK_RUN_MODE=local` (local subprocess) or `MLBLOCK_RUN_MODE=gpu` (Vast.ai cloud instances).
  - Setting `VAST_API_KEY=mock-*` forces safe local execution for development.

---

## Testing & QA

### Backend Test Suite
- **Location**: `backend/mlblock/tests/`
- **Execution**: `uv run pytest mlblock/tests -q`
- **In-Memory Unit Tests**: `test_validation.py`, `test_types.py`, and `test_pipeline.py` run purely in memory without network or database dependencies.
- **Integration Tests**: `test_server.py` tests FastAPI endpoints with an in-memory SQLModel session pool (`StaticPool`).
- **Supabase Skipping**: Tests requiring live Supabase credentials skip cleanly (`pytest.skip`) when `DATABASE_URL` or admin keys are absent. Never assume a SQLite fallback exists.
- **Catalog Global State**: `BlockRegistry` / `Catalog` are process-global singletons. Avoid mutating block definitions in tests without cleaning up state between cases.

### Frontend Test Suite
- **Location**: `frontend/src/**/*.test.ts`
- **Execution**: `pnpm test` (Vitest 3.0)
- **Unit & Store Testing**: Vitest runs in Node without requiring a browser or live backend. Network requests in `../api/client` are mocked using `vi.mock`.
- **Core Test Coverage**:
  - `useAppStore.test.ts`: Zustand store state mutations, undo/redo limits (max 50 commits), and container nesting.
  - `pipelineDocument.ts` / `typeCheck.ts`: Edge classification symmetry, dirty fingerprint calculation, and shape tracking.
