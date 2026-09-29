---
title: 'DeepTrainer Multi-Slots Node & Integrated Inspector'
type: 'feature'
created: '2026-09-28'
status: 'done'
baseline_commit: '2973783fe6f9076e86e5f1ce715ba5d548bcf214'
route: 'dispatch'
review_loop_iteration: 0
context:
  - backend/mlblock/blocks/entrainement-DE497D/deep_trainer.py
  - frontend/src/components/flow/TrainerBlockNode.tsx
  - frontend/src/components/flow/BlockNode.tsx
  - frontend/src/components/flow/FlowCanvas.tsx
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Training a neural network currently requires wiring 4 anonymous inputs (`in_1..in_4`) on `train_model` and scattering auxiliary blocks for optimizers (`adam`), loss functions (`cross_entropy_loss`), and callbacks. This creates visual clutter and frequent wiring errors.

**Approach:** Implement `deep_trainer.py` on the backend and `TrainerBlockNode.tsx` on the frontend (CAP-2):
1. Backend canonical block `deep_trainer` in `Stage.TRAIN` (`#DE497D`) accepting `in_1: DataLoader`, `in_2: torch.nn.Module`, optional `in_3: DataLoader`, with integrated optimizer/loss parameters, returning `(trained_model, metrics)`.
2. Frontend custom ReactFlow node `TrainerBlockNode` with color-coded semantic slots (🟣 DataLoader, 🟠 Model, 🟢 Metrics), inline hyperparameter controls (epochs, optimizer, lr, loss), and metrics progression display.
3. Full integration into `nodeTypes` and fallback routing in `BlockNode.tsx`.

## Boundaries & Constraints

**Always:**
- Keep ports strictly typed: inputs `in_1: torch.utils.data.DataLoader`, `in_2: torch.nn.Module`, `in_3: torch.utils.data.DataLoader` (optional); outputs `out_1: torch.nn.Module`, `out_2: dict[str, list[float]]`.
- Follow Stage 3 styling (`Stage.TRAIN` - `#DE497D`).
- Support both local subprocess execution and code generation without dependencies on external state.

**Never:**
- Never use untyped `Any` for trainer slots.
- Never hardcode fixed epochs without user configurability.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Connect Model & Data | Output of `DataPipeline` connected to `in_1`, output of `sequential_container` connected to `in_2` | Valid connection; type classifier returns `VERDICT_COMPATIBLE` | Mismatch error if wrong dtype |
| Optional Val Data | `in_3` left unconnected | Training proceeds with training loss only; validation is valid | Graceful fallback |
| Inline Params | Epochs changed from 5 to 10 in UI | `updateFlowParam` updates node data fields; generator emits `epochs=10` | Clamped to positive integers |
| Multi-output Generation | Code generator generates script with `deep_trainer` | Generates `out_1, out_2 = deep_trainer(...)` with imports | Proper tuple unpacking |

</frozen-after-approval>

## Code Map

- `backend/mlblock/blocks/entrainement-DE497D/deep_trainer.py` -- Canonical multi-slot trainer block.
- `backend/mlblock/tests/test_validation.py` -- Validation tests for `deep_trainer` connections.
- `backend/mlblock/tests/test_pipeline.py` -- Codegen tests for `deep_trainer`.
- `frontend/src/components/flow/TrainerBlockNode.tsx` -- Custom UI node with semantic multi-slots and hyperparameter controls.
- `frontend/src/components/flow/BlockNode.tsx` -- Route `deep_trainer` to `TrainerBlockNode`.
- `frontend/src/components/flow/FlowCanvas.tsx` -- Register `trainer: TrainerBlockNode`.

## Tasks & Acceptance

**Execution:**
- [x] `backend/mlblock/blocks/entrainement-DE497D/deep_trainer.py` -- Implement canonical `deep_trainer` function with docstrings and type hints.
- [x] Backend tests in `test_validation.py` and `test_pipeline.py` -- Add unit tests for `deep_trainer`.
- [x] `frontend/src/components/flow/TrainerBlockNode.tsx` -- Create multi-slots trainer node with semantic color codes and inline controls.
- [x] Wire `TrainerBlockNode` in `BlockNode.tsx` and `FlowCanvas.tsx`.
- [x] Vitest & ESLint verification -- Ensure all tests and lint checks pass cleanly.

**Acceptance Criteria:**
- Given a pipeline connecting `load_torch_dataset` to `deep_trainer.in_1` and `sequential_container` to `deep_trainer.in_2`, validation succeeds.
- Generated code for `deep_trainer` unpacks `out_X, out_Y = deep_trainer(...)` and executes with PyTorch.
- UI renders semantic slot labels with colored handles matching Astryx dark theme.

## Implementation Notes

- Implemented pure canonical block `backend/mlblock/blocks/entrainement-DE497D/deep_trainer.py` with typed multi-slots (`in_1: DataLoader`, `in_2: nn.Module`, `in_3: DataLoader` optional) and tuple outputs `(trained_model, metrics)`.
- Added unit tests in `test_validation.py` and `test_pipeline.py` confirming validation passes from `sequential_container` -> `deep_trainer` and codegen produces clean tuple unpacking `out_1, out_2 = deep_trainer(...)`.
- Implemented `TrainerBlockNode.tsx` using Astryx design tokens and dark theme, displaying semantic slot indicators (🟣 DataLoader, 🟠 Model, 🟢 Metrics) with live connection glow and integrated hyperparameter inspector (epochs, optimizer, lr, loss).
- Integrated `TrainerBlockNode` into `BlockNode.tsx` and registered `trainer` node type in `FlowCanvas.tsx`.
- Verified all 120 backend pytest tests, 90 frontend vitest tests, ESLint (0 warnings), and production build.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && uv run pytest mlblock/tests -q` -- expected: all backend tests pass.
- `cd backend && uv run ruff check .` -- expected: clean ruff check.
- `cd frontend && pnpm test` -- expected: all vitest tests pass.
- `cd frontend && pnpm exec eslint . --max-warnings 0` -- expected: 0 warnings.
- `cd frontend && pnpm run build` -- expected: build succeeds.
