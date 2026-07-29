# Repository Guidelines

## Project Overview

MLBlock is a Python ML pipeline builder with a FastAPI backend and React frontend. Users define ML pipelines as DAGs of composable blocks (neural layers, sklearn models, data loaders, RL environments), which can be validated, executed locally, code-generated into standalone scripts, or dispatched to remote GPUs via Vast.ai. Data persists in PostgreSQL (via Supabase) with SQLModel ORM. Deployed on Render.

## Architecture & Data Flow

Two-layer system bridged at import time:

```
JSON config → ConfigLoader.validate() → Graph (DAG) → Pipeline
                                                         ├→ run()        (execute blocks in topo order)
                                                         └→ generate_code() → standalone Python script
```

- **Core engine** (`backend/mlblock/core/`): dict-based `GraphNode`/`Edge`/`Graph`, Kahn's topological sort, v1 `BlockMeta`/`BlockRegistry` (class-level dict), `Pipeline` orchestration, `CodeGenerator` (emits standalone Python with HTTP callbacks), `VastAI` client (SSH-based GPU execution).
- **Server layer** (`backend/mlblock/server/`, `models/`): FastAPI REST with Pydantic v2 schemas, SQLModel ORM (4 tables: `profiles`, `pipelines`, `jobs`, `job_outputs`), dual auth (Supabase JWT + GPU Bearer token).
- **Bridge**: `blocks/registry.py` `_discover()` runs at import time, scans `blocks/**/*.py`, introspects functions via `inspect.signature`, and populates both `BLOCK_REGISTRY` (server Pydantic models) and `BlockRegistry` (core execution dict). Stores source code in `BLOCK_SOURCES`.
- **Frontend** (`frontend/`): React 18 + Vite + TypeScript + Zustand, communicates with backend via REST.

Data flow for pipeline execution:
1. User creates pipeline via REST → stored in `pipelines` table with JSON nodes/edges
2. `POST /{id}/execute` → creates `Job` row, dispatches to `VastAI` (or local)
3. GPU runs generated code → calls back `POST /jobs/{id}/status|output|error`
4. Results stored in `jobs` and `job_outputs` tables

## Project Structure

```
backend/                          # Python backend (uv workspace root)
├── mlblock/
│   ├── core/                     # Engine: graph, pipeline, config, code generator, vast.ai client
│   ├── blocks/                   # Block library: 8 category dirs, auto-discovered
│   ├── server/                   # FastAPI: routes, auth, database, schemas
│   ├── models/                   # Pydantic v2: PipelineDef, BlockSpec, BlockRegistry (v2)
│   ├── configs/                  # Pipeline JSON configs (e.g., cnn_mnist.json)
│   └── tests/                    # pytest suite (58 tests, 6 test files)
├── main.py                       # Example generated code output (standalone CNN script)
├── .env.example                  # Required: DATABASE_URL, SUPABASE_*, VAST_API_KEY, GPU_API_KEY
├── pyproject.toml                # Canonical deps — uv (pyproject.toml, uv.lock committed)
└── requirements.txt              # Exact match of pyproject.toml deps (flat, for non-uv envs)
frontend/                         # React + Vite frontend
├── src/
├── package.json
└── vite.config.ts
.github/
├── release-drafter.yml           # Release automation (no CI test workflow)
└── pull_request_template.md
render.yaml                       # Render deploy config (backend + frontend static site)
AGENTS.md                         # This file
README.md
```

## Development Commands

All backend commands run from `backend/` with `uv`:
```bash
uv sync                              # Install deps (creates .venv)
uv run python -m mlblock             # Codegen from default config (cnn_mnist.json)
uv run python -m mlblock config.json --mode build  # Build + run model
uv run uvicorn mlblock.server.main:app --reload    # Dev server
uv run pytest -v                     # All tests (requires DATABASE_URL in env)
uv run pytest mlblock/tests/test_server.py -v  # Single file
```

Frontend commands from `frontend/`:
```bash
npm install        # Install deps
npm run dev        # Vite dev server
npm run build      # Production build
```

## Code Conventions

- **Python >=3.10** with `from __future__ import annotations` in most core files
- **Pydantic v2** for all data models (`BaseModel`, `model_validator`, `Field`)
- No docstrings on most functions; brief comments for non-obvious logic
- French in user-facing strings (error messages, CLI help), English in code/variable names
- **Blocks are plain module-level functions** — no base class. Auto-discovered by scanning `blocks/**/*.py` at import time via `inspect.signature`. First param is always `in_1`, outputs `out_1`, `out_2`, etc. Folder naming: `{category}_{hexColor}/`.
- Neural blocks import torch at module level; sklearn/gymnasium blocks import lazily inside function.
- Entirely sync except FastAPI lifespan (`asynccontextmanager`). FastAPI routes are sync (not `async def`).
- `ValueError` for validation failures, `HTTPException` for API errors, `NotImplementedError` in `BlockMeta.execute()` when no builder registered.

## Testing & QA

- **pytest** with `httpx` for HTTP — **58 tests** across 6 files
- **Real PostgreSQL** required via `DATABASE_URL` env var — **no SQLite fallback** (raises `RuntimeError` if unset)
- Auth bypassed via `dependency_overrides`: `get_current_user` → fixed UUID, `verify_gpu_key` → fixed string
- Coverage gaps: GPU execution, job management, real auth, PostgreSQL integration, error edge cases

## Gotchas

- **Import order matters**: `mlblock/__init__.py` triggers block auto-discovery at import time (imports `mlblock.blocks.registry`). Importing `mlblock` before DB is available will try to connect to PostgreSQL. Tests mitigate via `conftest.py` stripping `DATABASE_URL` before import.
- **Block registration is class-level**: `BlockRegistry._blocks` is a class dict — tests sharing a process see all blocks from prior imports. No teardown needed.
- **Generated code uses `requests`**: Standalone Python scripts call back to backend via HTTP with `BACKEND_URL`, `GPU_API_KEY`, `JOB_ID` env vars.
- **`backend/main.py`** is generated code output, NOT a source file — ignore it.
- **Database**: PostgreSQL via Supabase pooler (`aws-0-*-pooler.supabase.com:6543`, transaction mode, IPv4). Direct `db.*` hostname is IPv6-only. Percent-encode special chars in password (`?` → `%3F`, `@` → `%40`, `*` → `%2A`).
