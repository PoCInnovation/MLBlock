---
title: 'DataPipeline & MLPipeline Super-Blocks'
type: 'feature'
created: '2026-09-28'
status: 'done'
baseline_commit: '2973783fe6f9076e86e5f1ce715ba5d548bcf214'
route: 'dispatch'
review_loop_iteration: 0
context:
  - backend/mlblock/blocks/donnees-22C55E/data_pipeline.py
  - backend/mlblock/blocks/modeles-F59E0B/ml_pipeline.py
  - frontend/src/components/flow/DataPipelineNode.tsx
  - frontend/src/components/flow/MLPipelineNode.tsx
  - frontend/src/components/flow/BlockNode.tsx
  - frontend/src/components/flow/FlowCanvas.tsx
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Loading, transforming, batching, and splitting data currently requires chaining 4-5 atomic blocks (`load_torch_dataset`, `resize`, `to_tensor`, `normalize`, `data_loader`), cluttering the canvas. Similarly, classic tabular ML requires manual chaining of scalers, PCA, and estimators.

**Approach:** Implement the two linear workflow Super-Blocks (CAP-3):
1. `DataPipeline` (`donnees-22C55E/data_pipeline.py`): Ingests dataset, prepares transforms, and outputs train/test DataLoaders directly to `DeepTrainer`.
2. `MLPipeline` (`modeles-F59E0B/ml_pipeline.py`): Takes tabular DataFrame, applies scaling/PCA, and fits estimator (LogisticRegression, RandomForest, etc.), outputting model and predictions.
3. Frontend nodes `DataPipelineNode.tsx` and `MLPipelineNode.tsx` with clear stage badges, parameter selectors, and dedicated ports.

## Boundaries & Constraints

**Always:**
- Keep ports strictly typed:
  - `DataPipeline`: outputs `out_1: torch.utils.data.DataLoader`, `out_2: torch.utils.data.DataLoader`.
  - `MLPipeline`: input `in_1: pd.DataFrame`, outputs `out_1: Model`, `out_2: numpy.ndarray`.
- Follow Stage 0/1 (`#22C55E`) and Stage 2 (`#F59E0B`) color conventions.
- Maintain seamless compatibility with code generation and Kahn topological sorting.

**Never:**
- Never output untyped generic objects.
- Never crash on missing optional validation data.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DataPipeline to DeepTrainer | Output `out_1` of `data_pipeline` connected to `deep_trainer.in_1` | `validate()` returns `valid: true`; Kahn sort orders `data_pipeline` before `deep_trainer` | Compatible type resolution |
| MLPipeline on Iris DataFrame | `load_sklearn_dataset` connected to `ml_pipeline.in_1` | `validate()` returns `valid: true`; Pipeline executes scaler + estimator | Returns fitted model and predictions |
| Codegen Execution | Pipeline with `data_pipeline` -> `deep_trainer` | Generates runnable script defining and calling both blocks | Executable without missing imports |

</frozen-after-approval>

## Code Map

- `backend/mlblock/blocks/donnees-22C55E/data_pipeline.py` -- Data preparation super-block.
- `backend/mlblock/blocks/modeles-F59E0B/ml_pipeline.py` -- Tabular ML super-block.
- `backend/mlblock/tests/test_validation.py` -- Validation tests for new super-blocks.
- `backend/mlblock/tests/test_pipeline.py` -- Codegen tests for new super-blocks.
- `frontend/src/components/flow/DataPipelineNode.tsx` -- UI node for DataPipeline.
- `frontend/src/components/flow/MLPipelineNode.tsx` -- UI node for MLPipeline.
- `frontend/src/components/flow/BlockNode.tsx` & `FlowCanvas.tsx` -- Node routing and canvas registration.

## Tasks & Acceptance

**Execution:**
- [x] `backend/mlblock/blocks/donnees-22C55E/data_pipeline.py` -- Implement `data_pipeline` with dataset selection, batch size, and transforms.
- [x] `backend/mlblock/blocks/modeles-F59E0B/ml_pipeline.py` -- Implement `ml_pipeline` with scaler, PCA, and estimator.
- [x] Backend tests in `test_validation.py` and `test_pipeline.py` -- Unit tests for validation and code generation.
- [x] `frontend/src/components/flow/DataPipelineNode.tsx` & `MLPipelineNode.tsx` -- Frontend custom node components with Astryx styling.
- [x] Route and register both nodes in `BlockNode.tsx` and `FlowCanvas.tsx`.
- [x] Vitest & ESLint verification -- Ensure all tests and lint checks pass cleanly.

**Acceptance Criteria:**
- Connecting `data_pipeline.out_1` to `deep_trainer.in_1` validates with `valid: true`.
- Connecting `load_csv` to `ml_pipeline.in_1` validates with `valid: true`.
- Frontend displays specialized UI cards with inline parameter selectors and colored handles.

## Implementation Notes

- Implemented `data_pipeline` in `backend/mlblock/blocks/donnees-22C55E/data_pipeline.py` with multi-dataset support (`cifar10`, `mnist`, `fashion_mnist`, `custom`), batch size, train/test splitting, and outputs `(train_loader, test_loader)`.
- Implemented `ml_pipeline` in `backend/mlblock/blocks/modeles-F59E0B/ml_pipeline.py` wrapping Scikit-Learn `Pipeline` (StandardScaler/MinMaxScaler, PCA, LogisticRegression/RandomForest/KMeans) and outputs `(pipe, preds)`.
- Added unit tests in `test_validation.py` and `test_pipeline.py` validating connections and code generation for both super-blocks.
- Implemented `DataPipelineNode.tsx` (Stage 0/1, `#22C55E`) and `MLPipelineNode.tsx` (Stage 2, `#F59E0B`) with custom controls and reactive handles.
- Integrated both nodes in `BlockNode.tsx` and registered `data_pipeline` and `ml_pipeline` node types in `FlowCanvas.tsx`.
- Verified all 123 backend pytest tests, 90 frontend vitest tests, ESLint (0 warnings), and frontend production build.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd backend && uv run pytest mlblock/tests -q` -- expected: all backend tests pass.
- `cd backend && uv run ruff check .` -- expected: clean ruff check.
- `cd frontend && pnpm test` -- expected: all vitest tests pass.
- `cd frontend && pnpm exec eslint . --max-warnings 0` -- expected: 0 warnings.
- `cd frontend && pnpm run build` -- expected: build succeeds.
