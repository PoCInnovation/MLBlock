## ADDED Requirements

_No new capabilities — this is a pure cleanup change._

## MODIFIED Requirements

_No spec-level behavior changes._

## REMoved Requirements

### Requirement: Stub block registration

Stub blocks (rl, environment, advanced, visualization) previously auto-registered into `BLOCK_REGISTRY` at import time, appearing in the API block listing.

**Reason**: All stub functions are either `pass` bodies or reference undefined variables. They return broken results and inflate the block catalog with unusable entries.

**Migration**: None — these blocks were never functional. Re-implement when RL/environment features are built.

### Requirement: Block schema compatibility shims

`Block.get()` and `Block.__getitem__` provided dict-like access to Pydantic Block models, returning hardcoded fake values.

**Reason**: Zero callers in the codebase. The hardcoded values (`"in_1"`, `"torch.Tensor"`, fake template strings) don't match actual block specs.

**Migration**: None — no code depends on these methods.

### Requirement: Dependency collection helpers

`_blocks_used_in()` and `_collect_dependencies()` extracted pip dependency strings from block imports.

**Reason**: Zero callers. The `--with` flag they generate is never passed to any execution path.

**Migration**: None — the feature was never wired up.
