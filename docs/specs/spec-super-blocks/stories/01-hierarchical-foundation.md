---
title: 'Hierarchical Container Foundation & Serialization'
type: 'feature'
created: '2026-09-27'
status: 'done'
baseline_commit: '352e9f4eb413fd9f46dc89058735a6d6ecbf439c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - backend/mlblock/models/pipeline.py
  - backend/mlblock/validation.py
  - backend/mlblock/core/generator.py
  - frontend/src/store/pipelineDocument.ts
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The MLBlock canvas drops child steps inside container blocks upon saving because frontend serialization omits `children`, while the backend validator and code generator reject or silently skip container nodes (`sequential_container`), causing runtime `NameError` on GPU execution.

**Approach:** Wire the hierarchical plumbing across both stacks: serialize `children` in frontend `pipelineDocument.ts` (payload and fingerprint), register `sequential_container` in `catalog.py` with typed ports, isolate container children from Kahn's topological sort in `validation.py`, and generate inlined `torch.nn.Sequential` blocks in `generator.py`.

## Boundaries & Constraints

**Always:**
- Keep Kahn's topological sort in `validation.py` strictly at the macro-node level; validate child sequence compatibility ($Child_i \to Child_{i+1}$) in an isolated linear sub-routine.
- Retain 100% backwards compatibility with flat baseline configs (`PipelineNode.children` defaults to empty list).
- Ensure generated code emits valid `torch.nn.Sequential` syntax with helper sources for all child layers inlined in the script header.

**Never:**
- Never inject child nodes into the global `edges` list or global in-degree map of Kahn's algorithm.
- Never use the `Any` type for container ports (`in_1: Tensor`, `out_1: torch.nn.Module`).
- Never introduce `parentId` subflows into ReactFlow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Container Save & Load | FlowNode with 3 child steps (conv2d, relu, maxpool) | `toServerPayload()` includes `children: [...]`; `fingerprintOf()` changes when a step is added | Returns valid JSON with non-empty children |
| Container Validation | Pipeline with `DataPipeline` -> `sequential_container` -> `train_model` | `validate()` returns `valid: true`; Kahn topo-sort orders macro-nodes; child steps validated linearly | Raises descriptive error if child layer dtypes are incompatible |
| Unknown Child Layer | `sequential_container` containing unlisted `foo_layer` | `validate()` detects unknown child type | Returns `errors: ["Unknown child block type 'foo_layer' in container '...'"]` |
| Container Codegen | Valid pipeline containing `sequential_container` | Generated script contains `out_X = torch.nn.Sequential(...)` with child layer definitions inlined | N/A |
| Empty Container | `sequential_container` with `children: []` | Validation accepts or warns; codegen produces `out_X = torch.nn.Identity()` | Graceful fallback |

</frozen-after-approval>

## Code Map

- `frontend/src/store/pipelineDocument.ts` -- Maps FlowNodes to server payload and computes canvas fingerprint; must forward `children`.
- `frontend/src/utils/blockHelpers.ts` -- Utility converting nodes; remove hardcoded `children: []`.
- `backend/mlblock/blocks/registry.py` & `backend/mlblock/catalog.py` -- Block discovery and registry; register `sequential_container` spec.
- `backend/mlblock/validation.py` -- Topo-sort and validation; isolate Kahn to macro-nodes and add `validate_container_children()`.
- `backend/mlblock/core/generator.py` -- Standalone codegen; inline `torch.nn.Sequential` and include child block helper sources.
- `backend/mlblock/models/pipeline.py` -- Pydantic models; ensure alias resolution in `validate_dtype_compatibility`.
- `backend/mlblock/tests/test_validation.py` -- Pytest suite; add unit tests for container validation.
- `backend/mlblock/tests/test_pipeline.py` -- Pytest suite; add unit tests for container codegen.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/store/pipelineDocument.ts` -- Include `children` in `toServerPayload` and `fingerprintOf` -- Preserves container children and enables dirty-tracking/undo.
- [x] `frontend/src/utils/blockHelpers.ts` -- Forward existing `children` array instead of hardcoding `[]` -- Preserves nested layers in helper conversions.
- [x] `backend/mlblock/blocks/registry.py` & `backend/mlblock/catalog.py` -- Register `sequential_container` with Stage.REPRESENT and ports `in_1: Tensor -> out_1: torch.nn.Module` -- Allows Pydantic and catalog validation to recognize container blocks.
- [x] `backend/mlblock/validation.py` -- Implement `validate_container_children()` and keep Kahn macro-only -- Validates linear layer stacks without cyclic graph errors.
- [x] `backend/mlblock/core/generator.py` -- Add container inlining branch for `sequential_container` with recursive source collection -- Emits clean `torch.nn.Sequential` code.
- [x] `backend/mlblock/tests/test_validation.py` & `backend/mlblock/tests/test_pipeline.py` -- Add unit tests for container validation and codegen -- Proves regression-free operation.

**Acceptance Criteria:**
- Given a pipeline with a `sequential_container` holding `conv2d_layer` and `relu_layer`, when `validation.validate` is called, then it returns `valid: true` and Kahn sort lists the container without cycle errors.
- Given a pipeline with `sequential_container`, when `generate_code` is called, then the output string contains `torch.nn.Sequential` and `def conv2d_layer`, and executes cleanly with `python -c`.
- Given a frontend canvas state with a node containing children, when `toServerPayload` is executed, then the resulting `PipelineNode.children` contains the child layers.

## Implementation Notes

- Registered `sequential_container` in `backend/mlblock/blocks/layers-6366F1/sequential_container.py` as a canonical pure block returning `nn.Sequential()`.
- Implemented `validate_container_children` in `backend/mlblock/validation.py` checking step-to-step sequential connectivity.
- Implemented container inlining in `backend/mlblock/core/generator.py` producing `nn.Sequential(...)` with recursive block source collection.
- Forwarded `children` in `toServerPayload`, `fingerprintOf`, and `backfillNodes` in `frontend/src/store/pipelineDocument.ts` and `frontend/src/utils/blockHelpers.ts`.
- All 118 backend pytest tests pass (0 failures) and all 84 frontend vitest tests pass (0 failures, 0 ESLint warnings).

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && uv run pytest mlblock/tests/test_validation.py -v` -- expected: all validation tests pass including container tests.
- `cd backend && uv run pytest mlblock/tests/test_pipeline.py -v` -- expected: all codegen tests pass including sequential container tests.
- `cd frontend && pnpm test` -- expected: 81+ vitest tests pass.
- `cd frontend && pnpm exec eslint . --max-warnings 0` -- expected: zero lint warnings.
