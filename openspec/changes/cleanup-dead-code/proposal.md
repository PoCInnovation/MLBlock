## Why

The ponytail audit found ~320 lines of dead code, unused abstractions, and stub blocks across the codebase. This debt slows onboarding, inflates the test surface, and hides real logic behind fake shims (e.g., `Block.get()` returning hardcoded values). Cleaning it now — before the codebase grows — keeps the signal-to-noise ratio healthy.

## What Changes

- **Delete dead modules**: `models/registry.py`, `models/block_spec.py`, `models/__init__.py`, `models/cnn.py`, `demo.py`, `test_gen.py`
- **Delete dead functions**: `_blocks_used_in`, `_collect_dependencies` in routes.py; `build_model()` alias in pipeline.py
- **Delete dead schema methods**: `Block.get()`, `Block.__getitem__`, `Block.deps` field in schemas.py
- **Delete stub blocks**: entire `rl_8B5CF6/`, `environment_14B8A6/`, `advanced_6B7280/`, `visualization_EC4899/` directories (all `pass` bodies or broken code referencing undefined variables)
- **No breaking changes**: `PipelineNode`, `PipelineEdge`, `PipelineDef` stay — they're used by schemas/routes/generator

## Capabilities

### New Capabilities

_None — this is a cleanup, not a feature._

### Modified Capabilities

_None — no spec-level behavior changes. Internal dead code removal only._
