# MLBlock — Project Context

## Overview

Visual-block-to-PyTorch code generator. Reads JSON DAG of NN building blocks → generates valid Python training script or builds live `nn.Sequential` model.

## Stack

- **Python >=3.10**, Pydantic v2, PyTorch >=2.0
- **FastAPI + SQLModel + SQLite** (optional server)
- **Package manager**: `uv` (lockfile)
- **No formatter, linter, type checker, pre-commit**

## Key Architecture

```
JSON DAG → ConfigLoader → PipelineDef (Pydantic v2)
    → Graph (Kahn's topological sort, cycle detection, port/dtype validation)
    → Pipeline → CodeGenerator → Python source
    → Pipeline → build_model() → nn.Sequential (--mode build)
```

- **CLI**: `python -m mlblock [config.json] [--mode generate|build]`
- **Server**: FastAPI on `:8000` — `python -m mlblock.server.main`
- **Tests**: `uv run pytest` — 51 tests across 5 files, must run sequentially (shared class-level `BlockRegistry._blocks`)

## Block System

- Auto-discovery: `blocks/registry.py` walks `blocks/` dir, imports every `.py`, registers `BLOCK = BlockSpec(...)` constant
- Blocks can also export `BUILD` callable for live model building (`meta.can_build()`)
- Categories: `neural/`, `data/`, `evaluation/`, `rl/`, `visualization/`, `advanced/`, `models/`

## Key Files

| File | Purpose |
|---|---|
| `mlblock/__main__.py` | CLI entry |
| `mlblock/core/graph.py` | DAG construction, topological sort, validation |
| `mlblock/core/generator.py` | Template resolution, code assembly |
| `mlblock/core/pipeline.py` | Pipeline wrapper (generate_code or build_model) |
| `mlblock/core/block.py` | BlockMeta, BlockRegistry._blocks (class-level shared) |
| `mlblock/core/config.py` | ConfigLoader — JSON → PipelineDef |
| `mlblock/models/pipeline.py` | PipelineNode, PipelineEdge, PipelineDef (Pydantic v2) |
| `mlblock/models/block_spec.py` | BlockSpec, ParamSpec, PortSpec |
| `mlblock/server/main.py` | FastAPI server |
| `mlblock/server/routes.py` | REST API (CRUD, validate, generate, build) |

## Constraints

- Synchronous only — no async/await
- No abstract base classes, protocols, or DI
- Fail-fast at pipeline build time — no try/except in core logic
- ConfigLoader is stateless (instantiate once per pipeline)
- No environment variables
