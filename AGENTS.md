# Repository Guidelines

## Project Overview

MLBlock is a Python ML pipeline builder with a FastAPI backend. Users define ML pipelines as DAGs of composable blocks (neural layers, sklearn models, data loaders, RL environments), which can be validated, executed locally, code-generated into standalone scripts, or dispatched to remote GPUs via Vast.ai. Data persists in PostgreSQL (via Supabase) with SQLModel ORM.

## Architecture & Data Flow

Two-layer system bridged at import time:

```
JSON config → ConfigLoader.validate() → Graph (DAG) → Pipeline
                                                         ├→ run()        (execute blocks in topo order)
                                                         └→ generate_code() → standalone Python script
```

- **Core engine** (`core/`): dict-based `GraphNode`/`Edge`/`Graph`, Kahn's topological sort, v1 `BlockMeta`/`BlockRegistry` (class-level dict), `Pipeline` orchestration, `CodeGenerator` (emits standalone Python with HTTP callbacks), `VastAI` client (SSH-based GPU execution).
- **Server layer** (`server/`, `models/`): FastAPI REST with Pydantic v2 schemas, SQLModel ORM (4 tables: `profiles`, `pipelines`, `jobs`, `job_outputs`), dual auth (Supabase JWT + GPU Bearer token).
- **Bridge**: `blocks/registry.py` `_discover()` runs at import time, scans `blocks/**/*.py`, introspects functions via `inspect.signature`, and populates **both** `BLOCK_REGISTRY` (server Pydantic models) and `BlockRegistry` (core execution dict). Stores source code in `BLOCK_SOURCES`.

Data flow for pipeline execution:
1. User creates pipeline via REST → stored in `pipelines` table with JSON nodes/edges
2. `POST /{id}/execute` → creates `Job` row, dispatches to `VastAI` (or local)
3. GPU runs generated code → calls back `POST /jobs/{id}/status|output|error`
4. Results stored in `jobs` and `job_outputs` tables

## Key Directories

```
backend/
├── mlblock/
│   ├── core/           # Engine: graph, pipeline, config, code generator, vast.ai client
│   ├── blocks/         # Block library: 8 categories, 53+ files, auto-discovered
│   │   ├── neural_6366F1/      # 33 torch.nn wrappers (conv, linear, activations, norms, rnn)
│   │   ├── models_F59E0B/      # 3 sklearn wrappers (linear/logistic regression, random forest)
│   │   ├── data_22C55E/        # Data loading (CSV, train/test split)
│   │   ├── evaluation_EF4444/  # Model evaluation
│   │   ├── rl_8B5CF6/          # RL training/evaluation (stubs)
│   │   ├── environment_14B8A6/ # Gymnasium env wrappers (stubs)
│   │   ├── visualization_EC4899/ # Plotting, video recording
│   │   └── advanced_6B7280/    # AutoML, arbitrary code execution
│   ├── server/         # FastAPI: routes, auth, database, schemas
│   ├── models/         # Pydantic v2: PipelineDef, BlockSpec, BlockRegistry (v2)
│   ├── configs/        # Pipeline JSON configs (e.g., cnn_mnist.json)
│   └── tests/          # pytest suite (52 tests)
├── alembic/            # Database migrations (Alembic)
├── main.py             # Example generated output (standalone CNN script)
├── pyproject.toml      # Canonical deps (uv)
├── requirements.txt    # Flat deps (drifts from pyproject.toml — 6 missing)
└── .env.example        # 7 env vars
```

## Development Commands

```bash
# Install (from backend/)
uv sync

# Run CLI
uv run python -m mlblock                    # generate code from default config
uv run python -m mlblock config.json --mode build  # build and run model

# Run server
uv run uvicorn mlblock.server.main:app --reload

# Run tests
cd backend && uv run pytest -v

# Run specific test file
uv run pytest mlblock/tests/test_server.py -v

# Database migrations (from backend/)
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "description"
```

## Code Conventions & Common Patterns

### Language & Style
- **Python ≥3.10** with `from __future__ import annotations` in most core files
- **Type hints** throughout (Pydantic v2 style, `dict[str, Any]`, `list[...]`, `X | None`)
- **Pydantic v2** for all data models (`BaseModel`, `model_validator`, `Field`)
- No docstrings on most functions; brief comments for non-obvious logic
- French in user-facing strings (error messages, CLI help), English in code/variable names

### Block System
Blocks are **plain module-level functions** — no base class, no ABC. Convention-driven registration:

```python
# blocks/neural_6366F1/relu.py — representative pattern
def relu(in_features: int = 512) -> torch.nn.Module:
    """Rectified Linear Unit activation."""
    return torch.nn.ReLU()
```

- Folder naming: `{category}_{hexColor}/` (e.g., `neural_6366F1`)
- Auto-discovered by `blocks/registry.py`: scans `**/*.py`, introspects `inspect.signature`
- Dual-registered: `BLOCK_REGISTRY` (server Pydantic `Block`) + `BlockRegistry` (core `BlockMeta`)
- Neural blocks import torch at module level; sklearn/gymnasium blocks import lazily inside function
- Input port convention: first param is always `in_1`, outputs are `out_1`, `out_2`, etc.

### Error Handling
- `ValueError` for validation failures (graph, config, port mismatch)
- `HTTPException` for API errors (401/403/404)
- `NotImplementedError` in `BlockMeta.execute()` when no builder registered
- Broad `except Exception` in VastAI client and generated code callbacks

### Async Patterns
- Entirely sync except FastAPI lifespan (`asynccontextmanager`)
- FastAPI routes are sync (not `async def`) — threadpool execution

### Dependency Injection
- FastAPI `Depends()` for auth (`get_current_user`) and GPU auth (`verify_gpu_key`)
- `dependency_overrides` in tests to bypass auth and swap DB sessions

### Database
- SQLModel (SQLAlchemy + Pydantic) with 4 tables
- PostgreSQL in prod, SQLite fallback when `DATABASE_URL` unset
- Connection pooling: `pool_size=20, max_overflow=10, pool_recycle=3600`
- Alembic for migrations: `backend/alembic/`, `alembic.ini` at `backend/`

## Important Files

| File | Purpose |
|------|---------|
| `backend/mlblock/__main__.py` | CLI entry: generate or build mode |
| `backend/mlblock/__init__.py` | Side-effect import triggers block auto-discovery |
| `backend/mlblock/server/main.py` | FastAPI app, CORS, router mounting |
| `backend/mlblock/server/routes.py` | All API endpoints (blocks, pipelines, jobs, validation, build) |
| `backend/mlblock/server/auth.py` | Supabase JWT verification via `python-jose` |
| `backend/mlblock/server/gpu_auth.py` | Bearer token auth for GPU→backend callbacks |
| `backend/mlblock/server/database.py` | Engine setup, `get_session()`, `init_db()` |
| `backend/mlblock/server/models.py` | SQLModel tables: Profile, Pipeline, Job, JobOutput |
| `backend/mlblock/server/schemas.py` | Pydantic v2 API schemas: Block, Page[T], Pipeline CRUD, Job events |
| `backend/mlblock/blocks/registry.py` | Auto-discovery engine: scans blocks, dual-registers |
| `backend/mlblock/core/block.py` | v1 `BlockMeta` + `BlockRegistry` (execution layer) |
| `backend/mlblock/core/graph.py` | `Graph`, `GraphNode`, `Edge` — DAG with Kahn's sort |
| `backend/mlblock/core/pipeline.py` | `Pipeline` — orchestrates execution or code gen |
| `backend/mlblock/core/generator.py` | `CodeGenerator` — standalone Python with HTTP callbacks |
| `backend/mlblock/core/config.py` | `ConfigLoader` — JSON loading + structural validation |
| `backend/mlblock/core/vast.py` | `VastAI` — GPU instance lifecycle (launch/start/execute/destroy) |
| `backend/mlblock/models/pipeline.py` | v2 Pydantic `PipelineDef` with model validators |
| `backend/mlblock/models/block_spec.py` | v2 `BlockSpec`, `ParamSpec`, `PortSpec` |
| `backend/mlblock/configs/cnn_mnist.json` | Example 12-node CNN pipeline config |

## Runtime/Tooling Preferences

- **Runtime**: Python ≥3.10 (runtime is 3.11)
- **Package manager**: `uv` (pyproject.toml is canonical, uv.lock committed)
- **Framework**: FastAPI + Uvicorn + SQLModel
- **ML**: PyTorch ≥2.0, scikit-learn ≥1.7, stable-baselines3 ≥2.9, gymnasium ≥1.3
- **Database**: PostgreSQL (Supabase) — required, no SQLite fallback
- **Pooler**: `aws-0-eu-west-3.pooler.supabase.com:6543` (IPv4, transaction mode). Direct `db.*` host is IPv6-only.
- **GPU orchestration**: Vast.ai API + SSH command execution
- **Auth**: Supabase JWT (HS256) for users, shared Bearer token for GPU callbacks
- **No Docker, no Makefile** — raw uv workflow

## Testing & QA

- **Framework**: pytest (v9.0.3+) with `httpx` for async HTTP
- **52 tests** across 5 files in `backend/mlblock/tests/`
- **Run**: `cd backend && uv run pytest -v`
- **Auth bypassed**: `dependency_overrides` swaps `get_current_user` → fixed UUID, `verify_gpu_key` → fixed string
- **DB isolation**: Tests use real PostgreSQL (Supabase) via `DATABASE_URL` from `.env`
- **Coverage gaps**: GPU execution, job management, real auth, PostgreSQL integration, error edge cases
- **No CI test workflow** — only release-drafter exists
- **`main.py`** in project root is generated code output, NOT a test
- `requirements.txt` drifts from `pyproject.toml` (missing: psycopg2-binary, python-dotenv, requests, python-jose, cryptography, numpy)

## Gotchas

- **Import order matters**: `mlblock/__init__.py` triggers block auto-discovery at import time. Importing `mlblock` before setting up the test DB will try to connect to PostgreSQL. Tests mitigate this via `conftest.py` stripping `DATABASE_URL`.
- **Block registration is class-level**: `BlockRegistry._blocks` is a class dict, so tests sharing a process see all blocks registered from prior imports. No teardown needed.
- **Generated code uses `requests`**: The code generator emits standalone Python scripts that call back to the backend via HTTP. These scripts use `BACKEND_URL`, `GPU_API_KEY`, and `JOB_ID` env vars.
- **`test_gen.py` in project root is generated output**, not a test file — ignore it.
