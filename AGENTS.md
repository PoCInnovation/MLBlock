# Repository Guidelines

## Project Overview

MLBlock is a visual-block-to-PyTorch code generator. It reads a JSON document describing a DAG of neural-network building blocks (convolution layers, activations, pooling, RL environments, data loading, evaluation metrics) and generates a valid Python training script. Built with Pydantic v2 for validation, a template-based code generator, and an auto-discoverable block catalog.

Entry point: `python -m mlblock [config_path]`

---

## Architecture & Data Flow

```
JSON config (DAG) → ConfigLoader → PipelineDef (Pydantic v2 validation)
    → Graph (topological sort, cycle detection, port-type checking)
    → Pipeline → CodeGenerator → Python source
```

1. **ConfigLoader** reads a JSON file and validates against `PipelineDef` + `BlockRegistry` context.
2. **Graph** builds a DAG from validated nodes/edges; produces a topological order (Kahn's algorithm with cycle detection).
3. **CodeGenerator** walks nodes in topological order, resolves template placeholders (`{params.*}`, `{input.*}`, `{output.*}`, `{node_id}`, `{metric_expr}`, `{plot_code}`, `{space_expr}`), collects imports, and assembles a `main()` function.
4. **Block auto-discovery** (`blocks/registry.py`) walks the `blocks/` directory tree at import time, imports each `.py` file, and registers anything with a module-level `BLOCK = BlockSpec(...)` constant into both a plain dict and the class-level `BlockRegistry`.

---

## Key Directories

| Directory | Purpose |
|---|---|
| `mlblock/` | Main Python package |
| `mlblock/core/` | Engine: block registry, config loader, graph builder, code generator, pipeline wrapper |
| `mlblock/models/` | Pydantic v2 type definitions: `BlockSpec`, `ParamSpec`, `PortSpec`, `PipelineDef`, `PipelineNode`, `PipelineEdge`, `BlockRegistry` (dict subclass) |
| `mlblock/blocks/` | Block catalog — subdirectories by category: `neural/`, `data/`, `evaluation/`, `rl/`, `visualization/`, `advanced/` |
| `mlblock/configs/` | Example JSON pipeline configs |
| `mlblock/tests/` | pytest test suite |
| `configs/` | Root-level copy of example config (default path) |
| `.github/` | CI/CD (release-drafter), issue/PR templates, guides |
| `chedli/` | Architecture docs, UML class diagram, contributing guide (gitignored, committed) |

---

## Development Commands

```bash
# Run the code generator (prints to stdout)
python -m mlblock [path/to/config.json]

# Run the demo (writes main.py)
python mlblock/demo.py

# Run tests
pytest

# Verbose tests
pytest -v

# Run a specific test file
pytest mlblock/tests/test_graph.py
```

No formatter, linter, or test-coverage tooling is configured. No pre-commit hooks.

---

## Code Conventions & Common Patterns

### Naming

- `snake_case` for functions, methods, variables, modules
- `PascalCase` for classes
- `UPPER_CASE` for module-level constants (e.g. `BLOCK`, `BLOCK_REGISTRY`)
- Test files: `test_<module>.py`; test functions: `test_<feature>`

### Pydantic v2

All models use Pydantic v2 with `model_validator(mode='after')` for cross-field validation:

```python
from pydantic import BaseModel, model_validator

class PipelineDef(BaseModel):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]

    @model_validator(mode='after')
    def _validate(self) -> Self:
        # cross-field checks
        return self
```

Validation context is injected via `model_validate(data, context=...)` to pass the `BlockRegistry` for type lookups.

### BlockSpec Templates

Each block is a `BlockSpec` with a `template` string containing placeholders:

```python
BlockSpec(
    label="Conv2d",
    category="neural",
    params={"out_channels": ParamSpec(type="int")},
    inputs=[PortSpec(name="input", dtype="tensor")],
    outputs=[PortSpec(name="output", dtype="tensor")],
    template=(
        "{node_id} = nn.Conv2d("
        "in_channels={input.input_shape[0]}, "
        "out_channels={params.out_channels}, "
        "kernel_size={params.kernel_size}"
        ")"
    ),
)
```

Placeholder types: `{params.*}`, `{input.*}`, `{output.*}`, `{node_id}`, `{metric_expr}`, `{plot_code}`, `{space_expr}`. Brace escaping with `{{`/`}}`.

### Block Discovery Pattern

Modules expose a `BLOCK` constant; discovery is side-effect-driven at import:

```python
# In mlblock/blocks/neural/conv.py
from mlblock.models.block_spec import BlockSpec

BLOCK = BlockSpec(...)
```

```python
# In mlblock/__init__.py
from mlblock.blocks import registry  # noqa: F401  # triggers _discover()
```

`blocks/registry.py` has a module-level `BLOCK_REGISTRY: dict[str, BlockSpec]` (plain dict) and also populates `core.block.BlockRegistry._blocks` (class-level dict). Both are kept in sync.

### Error Handling

- Validation errors raise `ValueError` with descriptive messages (`pytest.raises(ValueError, match=...)`)
- Pydantic validation failures raise `pydantic.ValidationError`
- No custom exception types
- No `try`/`except` in core logic — fail-fast at pipeline build time

### No Async

All code is synchronous. No `async`/`await`, no asyncio.

### No Dependency Injection / Protocols

- No abstract base classes, protocols, or interfaces
- `BlockRegistry` is a `dict[str, BlockSpec]` subclass (not a full registry pattern)
- `BlockMeta` wraps a `BlockSpec` with a name and provides property access — no custom metaclass despite the name

### State Management

- `BlockRegistry._blocks` is a class-level `dict[str, BlockMeta]` — shared mutable state
- Auto-discovery mutates this dict at import time
- Tests rely on the registry being populated before test run (sequential, not thread-safe)
- `ConfigLoader` is stateless (instantiate once per pipeline)

---

## Important Files

| File | Role |
|---|---|
| `mlblock/__main__.py` | CLI entry — loads config, validates, builds graph, prints generated code |
| `mlblock/__init__.py` | Package init; triggers block auto-discovery via side-effect import |
| `mlblock/models/block_spec.py` | Core types: `ParamSpec`, `PortSpec`, `BlockSpec` |
| `mlblock/models/pipeline.py` | Pipeline validation: `PipelineNode`, `PipelineEdge`, `PipelineDef` with `model_validator` |
| `mlblock/models/registry.py` | `BlockRegistry(dict[str, BlockSpec])` — simple typed dict |
| `mlblock/core/block.py` | `BlockMeta` (wraps BlockSpec with name), `BlockRegistry._blocks` (class-level registry) |
| `mlblock/core/config.py` | `ConfigLoader` — reads JSON, delegates Pydantic validation |
| `mlblock/core/graph.py` | `GraphNode`, `Edge`, `Graph` — DAG construction, topological sort, validation |
| `mlblock/core/generator.py` | `CodeGenerator` — template resolution, import extraction, code assembly |
| `mlblock/core/pipeline.py` | `Pipeline` — thin wrapper: `Graph` → `CodeGenerator` |
| `mlblock/blocks/registry.py` | Auto-discovery: walks `blocks/`, imports modules, registers `BLOCK` constants |
| `mlblock/demo.py` | End-to-end demo: reads config, prints and writes `main.py` |
| `pyproject.toml` | PEP 621 metadata, Python >=3.10, deps: torch>=2.0, pydantic>=2.0 |
| `requirements.txt` | Additional deps: pandas, scikit-learn, gymnasium, stable-baselines3, matplotlib |

---

## Runtime / Tooling Preferences

- **Python**: >=3.10 (PEP 621 in `pyproject.toml`)
- **Package manager**: `uv` (lockfile `uv.lock` present)
- **No formatter** (black/ruff): none configured
- **No linter** (ruff/pylint/mypy): none configured
- **No pre-commit**: none configured
- **No Docker/containerization**
- **No environment variables**

---

## Testing & QA

- **Framework**: pytest (plain, no unittest, no conftest.py)
- **Count**: 29 tests across 4 files
- **Style**: direct `assert` statements + `pytest.raises(ValueError, match=...)` / `pytest.raises(pydantic.ValidationError)`
- **No parametrize**, **no mocks**, **no fixtures** (except two temp-file fixtures in `test_config.py`)
- **Coverage**:
  - `test_block.py` (6 tests): BlockRegistry CRUD, BlockMeta properties
  - `test_config.py` (6 tests): JSON loading, Pydantic validation errors
  - `test_graph.py` (12 tests): Graph construction, topology, cycle detection, validation errors — most thorough
  - `test_pipeline.py` (5 tests): Integration — full stack Graph→Pipeline→CodeGenerator output validation
- **Gap**: `generator.py` has no dedicated test file (tested indirectly via pipeline tests)
- **Limitations**: shared class-level registry state precludes `xdist` parallelism; tests must run sequentially
