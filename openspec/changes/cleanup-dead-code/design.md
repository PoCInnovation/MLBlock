## Context

The codebase has two block registry systems (v1 `BlockMeta`/`BlockRegistry` in `core/block.py`, v2 `BlockSpec`/`BlockRegistry(dict)` in `models/`), a code generator with an unused `CodeGenerator` class wrapper, schema compatibility shims (`Block.get()`, `Block.__getitem__`) that return hardcoded fake values, and ~150 lines of stub blocks with `pass` bodies or broken code. The ponytail audit confirmed ~320 lines are dead.

## Goals / Non-Goals

**Goals:**
- Delete all confirmed dead code (~320 lines)
- Remove stub blocks that will never be called (rl, env, advanced, viz)
- Delete `demo.py` and `test_gen.py` (generated/off-script files)
- Keep `PipelineNode`, `PipelineEdge`, `PipelineDef` — they're structurally used

**Non-Goals:**
- Refactoring the v1/v2 registry into one (larger change, separate proposal)
- Inlining `CodeGenerator` class (it's used, just a thin wrapper)
- Fixing bugs in stub blocks (they're being deleted)
- Adding new features or tests

## Decisions

### D1: Delete `models/` subtree except `models/pipeline.py`

**Decision**: Remove `models/registry.py`, `models/block_spec.py`, `models/__init__.py`, `models/cnn.py`. Keep `models/pipeline.py` for `PipelineNode`/`PipelineEdge`.

**Rationale**: `models/pipeline.py` is imported by `schemas.py`, `routes.py`, and `generator.py`. The other files form a dead dependency chain: `cnn.py` → `demo.py` (only consumer), `registry.py` → `block_spec.py` (only consumer).

**Alternative considered**: Keep `BlockSpec` for future use. Rejected — YAGNI. If needed, it can be re-created in 27 lines.

### D2: Delete all stub block directories

**Decision**: Remove `rl_8B5CF6/`, `environment_14B8A6/`, `advanced_6B7280/`, `visualization_EC4899/` entirely.

**Rationale**: Every function in these directories is either `pass` or references undefined variables (`inputs`, `targets`, `predictions`). They auto-register into `BLOCK_REGISTRY` at import time, bloating the block list with unusable entries.

**Alternative considered**: Mark blocks as `disabled=True` in registry. Rejected — adds complexity for zero benefit. Re-implement when needed.

### D3: Delete dead routes helpers and schema shims

**Decision**: Remove `_blocks_used_in`, `_collect_dependencies` from `routes.py`. Remove `Block.get()`, `Block.__getitem__`, `Block.deps` from `schemas.py`.

**Rationale**: Grep confirms zero callers. `Block.get()` returns hardcoded fake values (`"in_1"`, `"torch.Tensor"`) that don't match actual block specs.

### D4: Delete `build_model()` alias

**Decision**: Remove `Pipeline.build_model()` (just `return self.run()`). Update `test_server.py::test_build_model` to call `run()` directly.

**Rationale**: Single-line alias with one callsite (a test). The test can call the real method.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Deleting stubs removes blocks from API listing | Intentional — stubs returned broken results anyway |
| `models/__init__.py` lazy import breaks `from mlblock.models import generate_code_from_config` | Only caller is `demo.py` which is also deleted |
| `Block.deps` removal breaks `_collect_dependencies` | Both are deleted together — zero callers |
| Tests may fail after cleanup | Run full test suite after each deletion batch |
