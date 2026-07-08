# Repository Guidelines

## Project Overview

**MLBlock** is a visual-block-to-PyTorch code generator. Users define ML pipelines as JSON DAGs; the system either generates a standalone Python script or builds an `nn.Sequential` at runtime. Blocks are auto-discovered Python modules exporting a `BLOCK` dict and optional `BUILD` callable.

- **Language**: Python ≥3.10
- **Package manager**: `uv`
- **Core deps**: PyTorch ≥2.0, Pydantic v2, FastAPI, SQLModel
- **Optional deps** (in `requirements.txt`): pandas, scikit-learn, gymnasium, stable-baselines3, matplotlib

## Architecture & Data Flow

```
JSON DAG config
  → ConfigLoader (Pydantic v2 validation, port/type checks)
    → Graph (Kahn's topological sort, cycle detection)
      → Pipeline
        ├─ generate_code() → CodeGenerator → Python source (.py)
        └─ run() → executes BUILD fns in topo order → dict of outputs
```

### Dual Execution Modes

1. **Generate** (`--mode generate`): JSON → ConfigLoader → Graph → CodeGenerator → Python source string with `main()`. Uses block `template` strings with `{params.X}`, `{input.X}`, `{output.X}`, `{node_id}` placeholders.
2. **Build** (`--mode build`): JSON → ConfigLoader → Graph → Pipeline.run() → calls each block's `BUILD()` in topological order, feeds upstream outputs as inputs. Returns dict of results (nn.Module, DataFrames, etc.).

### Block Discovery & Registration

1. `mlblock/__init__.py` imports `mlblock.blocks.registry` at import time
2. `blocks/registry.py` `_discover()` runs immediately:
   - Recursively scans `mlblock/blocks/**/*.py` via `rglob`
   - Skips `__init__.py` and `registry.py`
   - Imports each module, checks for `BLOCK` dict + optional `BUILD` callable
   - Registers into both `BLOCK_REGISTRY` (raw dict, for validation) and `BlockRegistry._blocks` (typed `BlockMeta`, for execution)

**Adding a new block** = drop a `.py` file anywhere under `mlblock/blocks/` exporting a `BLOCK` dict. No registration code needed.

### Module Dependency Chain

```
mlblock.__main__      → core.config, blocks.registry, core.graph, core.pipeline
mlblock.server.routes → blocks.registry, core.block, core.graph, core.pipeline,
                        models.pipeline, models.registry, server.database
blocks.registry       → core.block (BlockRegistry)
core.pipeline         → core.generator (CodeGenerator)
core.generator        → core.block (BlockRegistry for block lookup)
core.graph            → core.block (BlockRegistry for type resolution)
```

## Key Directories

```
mlblock/                 # Main package
  core/                  # Framework engine
    block.py             #   BlockMeta + BlockRegistry (class-level shared state)
    graph.py             #   Graph, GraphNode, Edge — DAG with topo sort
    pipeline.py          #   Pipeline wrapper (generate_code / run)
    config.py            #   ConfigLoader — JSON → validated graph dict
    generator.py         #   CodeGenerator — template resolution → Python source
  blocks/                # Auto-discovered block catalog
    registry.py          #   BLOCK_REGISTRY dict + _discover() via importlib
    neural/              #   30 blocks: conv, pool, norm, activation, recurrent, attention
    data/                #   load_csv, train_test_split
    evaluation/          #   evaluate (metrics + plot)
    models/              #   linear_regression, logistic_regression, random_forest
    rl/                  #   11 blocks: env, wrappers, train, evaluate, render (stable-baselines3)
    advanced/            #   auto_ml (stub), code_block (exec arbitrary Python)
    visualization/       #   plot_predictions
  models/                # Pydantic v2 type definitions
    block_spec.py        #   ParamSpec, PortSpec, BlockSpec
    pipeline.py          #   PipelineNode, PipelineEdge, PipelineDef (with model_validators)
    registry.py          #   BlockRegistry(dict[str, BlockSpec]) — typed wrapper
    cnn.py               #   generate_code_from_config(), run_from_config()
  server/                # FastAPI backend
    main.py              #   FastAPI app, CORS, lifespan, includes 3 routers
    routes.py            #   /api/blocks, /api/pipelines (CRUD+generate+build), /api/validate
    database.py          #   SQLModel/SQLAlchemy SQLite (mlblock.db)
    models.py            #   SQLModel Pipeline table
    schemas.py           #   Pydantic schemas (Page, Block/Pipeline CRUD, Validation, Generate, Build)
    __main__.py          #   uvicorn entry on 127.0.0.1:8000
  configs/               #   Sample JSON pipeline configs (internal copy)
configs/                 # Example JSON pipeline configs (root-level)
docs/                    #   project-context.md, mlblock_v1.md, routes.md, diagrammes.md
```

## Development Commands

```bash
# Install deps
uv sync

# Run CLI (generate code from config)
uv run python -m mlblock configs/linear_regression.json
uv run python -m mlblock configs/cnn_mnist.json --mode build

# Run FastAPI server
uv run python -m mlblock.server
# or
uvicorn mlblock.server.main:app --host 127.0.0.1 --port 8000 --reload

# Run tests
uv run python -m pytest mlblock/tests/ -v

# Demo (writes generated code to main.py)
uv run python mlblock/demo.py
```

## Code Conventions & Common Patterns

### Naming
- `snake_case` for functions, methods, variables, modules
- `PascalCase` for classes
- `UPPER_CASE` for module-level constants (e.g., `BLOCK`, `BLOCK_REGISTRY`)

### Block Pattern
Each block is a `.py` file exporting:
```python
BLOCK = {
    "label": "Conv2D",
    "category": "neural",
    "params": {"in_channels": {"type": "int", "required": True}, ...},
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": "..."
}

def BUILD(params):
    return nn.Conv2d(...)
```

### Template Placeholders
- `{params.X}` — block parameter value
- `{input.X}` — upstream variable from connected port
- `{output.X}` — generated variable name for this node's output
- `{node_id}` — the node's ID
- `{metric_expr}`, `{plot_code}`, `{space_expr}` — special placeholders for evaluation/RL blocks

### Error Handling
- Config validation raises `ValueError` with descriptive messages
- `Pipeline.run()` silently catches `NotImplementedError` (blocks without BUILD)
- Server routes raise `HTTPException` or return error response bodies
- No logging framework, no custom exception types

### State Management
- `BlockRegistry._blocks` is a **class-level dict** — shared mutable state across all instances
- Auto-discovery mutates this dict at import time
- Tests must run sequentially (not parallel-safe)
- `ConfigLoader` is stateless (instantiate once per pipeline)

### Validation (Three Layers)
1. `ConfigLoader.validate()` — raw dict validation against registry
2. `PipelineDef` Pydantic model_validators — typed validation (used by server)
3. `Graph.validate()` — graph-level (edge references, cycle detection)

### Patterns
- **Sync only** — no async/await in core. FastAPI routes are sync (run in threadpool).
- **No DI framework** — module-level singleton registries. FastAPI uses `Depends(get_session)` for DB.
- **No ABCs/protocols** — blocks are plain dicts + callables, not abstract classes.
- **Fail-fast** — validation errors raise immediately, no try/except in core logic.

## Important Files

| File | Role |
|---|---|
| `mlblock/__main__.py` | CLI entrypoint (argparse, generate/build modes) |
| `mlblock/__init__.py` | Triggers block auto-discovery at import |
| `mlblock/core/block.py` | BlockMeta + BlockRegistry (class-level shared state) |
| `mlblock/core/graph.py` | Graph, GraphNode, Edge — DAG + topo sort |
| `mlblock/core/pipeline.py` | Pipeline wrapper (generate_code / run) |
| `mlblock/core/config.py` | ConfigLoader — JSON validation |
| `mlblock/core/generator.py` | CodeGenerator — template resolution → Python source |
| `mlblock/blocks/registry.py` | Auto-discovery engine for block modules |
| `mlblock/models/pipeline.py` | PipelineDef with Pydantic model_validators |
| `mlblock/server/routes.py` | All REST API handlers (383 lines) |
| `mlblock/server/main.py` | FastAPI app factory |
| `pyproject.toml` | Project metadata (PEP 621, uv) |
| `docs/mlblock_v1.md` | v1 architecture spec (Supabase + Vast.ai) |

## Runtime/Tooling Preferences

- **Runtime**: Python ≥3.10 (targets 3.11 in lockfile)
- **Package manager**: `uv` (lockfile: `uv.lock`)
- **No formatter/linter/pre-commit** — follow existing style
- **CLI**: `python -m mlblock` (argparse-based)
- **Server**: `python -m mlblock.server` (uvicorn on :8000)
- **DB**: SQLite via SQLModel (`mlblock.db` in CWD)

## Testing & QA

- **Framework**: pytest (plain `assert` style, no test classes)
- **Location**: `mlblock/tests/` (5 test files) + `test_gen.py` at root (NOT a test — it's a generated output artifact)
- **Run**: `uv run python -m pytest mlblock/tests/ -v`
- **Execution order**: Sequential required (shared `BlockRegistry._blocks` class state)
- **Server tests**: Use `FastAPI TestClient` + tempfile SQLite DB + dependency override for session

### Test Coverage

| File | Tests | What it covers |
|---|---|---|
| `test_block.py` | 6 | BlockRegistry CRUD, by_category, params, template |
| `test_config.py` | 7 | ConfigLoader: load, validate, missing fields, bad edges |
| `test_graph.py` | 14 | Graph construction, topo sort, cycles, validation |
| `test_pipeline.py` | 5 | Pipeline.generate_code() output validation |
| `test_server.py` | 23 | All REST endpoints (blocks, pipelines, validate, generate, build) |

### Coverage Gaps
- `CodeGenerator` internals (tested indirectly via pipeline tests)
- `Pipeline.run()` / `build_model()` (tested via server tests only)
- Individual block `BUILD` functions
- `ConfigLoader` deep validation with registry context
- CLI entry points (`__main__.py`)
- `models/pipeline.py` Pydantic validators

### Adding a New Test
```python
# mlblock/tests/test_<module>.py
def test_<feature>():
    # direct assert style, no classes, no fixtures unless needed
    assert ...
```
