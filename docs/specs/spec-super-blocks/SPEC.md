---
id: SPEC-super-blocks
companions:
  - architecture-diagrams.md
  - catalog-mapping.md
  - ../../UX_Blocks_Rework/06-super-blocks.md
  - ../../prototypes/FEASIBILITY_REPORT.md
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Super-Blocks & Container Architecture (Macro/Micro Pipeline)

## Why

Assembling basic neural network architectures on MLBlock currently forces users to manually position 11 individual nodes and route 11 cables for a standard CIFAR-10 CNN, creating cognitive overload and frequent connection errors across 4 anonymous trainer ports (`in_1..in_4`). Introducing hierarchical Super-Blocks solves this by encapsulating 1D sequential recipes inside self-contained nodes while keeping the main canvas focused on a clean 3-node macro dataflow, cutting canvas clutter by 73% without sacrificing strong typing or standalone PyTorch codegen.

## Capabilities

- **CAP-1**
  - **intent:** User can construct a deep neural network by stacking layers in an in-node sequential drawer with real-time tensor shape tracking.
  - **success:** A multi-layer CNN is assembled within a single `SequentialModel` node; shape transitions are computed and displayed between layers in real time; output port emits a validated `torch.nn.Module`.

- **CAP-2**
  - **intent:** User can configure and execute PyTorch training through an orchestrator node with semantically colored connection anchors and integrated hyperparameter controls.
  - **success:** `DeepTrainer` exposes color-coded connection anchors for `train_data` (DataLoader), `val_data` (DataLoader), and `model` (nn.Module); loss function and optimizer are selectable via inspector controls; executions emit streaming metric epochs to Supabase and the canvas.

- **CAP-3**
  - **intent:** User can construct encapsulated data preparation workflows and classical Scikit-Learn pipelines within single container nodes.
  - **success:** `DataPipeline` emits train and test DataLoaders from raw dataset sources with chained transforms; `MLPipeline` chains tabular transformers (scaler, PCA) and classical estimators (LogisticRegression, KMeans) into unified executable pipelines.

- **CAP-4**
  - **intent:** System can validate and persist hierarchical pipelines without cyclic dependency errors or child node detachment.
  - **success:** Topological sorting runs Kahn's algorithm exclusively on macro-nodes while an internal validator verifies child layer sequence compatibility; `toServerPayload` and `fingerprintOf` serialize children preserving dirty-state tracking and undo/redo history.

- **CAP-5**
  - **intent:** System can generate standalone executable PyTorch Python scripts that inline sequential containers into standard `torch.nn.Sequential` instances.
  - **success:** Emitted Python code instantiates `torch.nn.Sequential` containing all child layer definitions and hyperparameter arguments; the script executes locally or on remote Vast.ai GPUs producing valid job outputs without `NameError`.

## Constraints

- Zero `Any` types in the TypeSystem: all macro ports must resolve to concrete type families (`DataLoader`, `torch.nn.Module`, `pd.DataFrame`, `dict`).
- In-node DOM rendering is required for sequential drawers: ReactFlow `parentId` subflows are prohibited to guarantee 60 FPS pan/zoom and prevent layout collision bugs.
- Topological sort in `validation.py` must isolate container children: child nodes must never appear as unconstrained roots in macro Kahn scheduling.
- Backwards compatibility with the 12 existing canonical JSON baseline pipelines in `backend/mlblock/configs/exos/` must be 100% preserved (`children` defaults to empty list).

## Non-goals

- Arbitrary 2D nested sub-canvases: container nodes strictly support 1D linear stacks, not multi-branch nested DAGs.
- Interactive Python code editor inside nodes: child layers are configured via structured segment controls, not freehand code entry.
- Direct execution of training loops inside the browser: execution remains delegated to subprocess or remote GPU workers via FastAPI and Supabase CDC.

## Success signal

A user can assemble, validate, and launch the CIFAR-10 baseline pipeline (A1) in under 2 minutes using exactly 3 macro-nodes and 2 cables; `validate` returns `valid: true` with zero type errors, and the generated standalone Python script runs to completion.

## Assumptions

- CIFAR-10 (A1) and Fashion-MNIST (A2) serve as the primary acceptance fixtures for the initial implementation phase.
- All individual layer blocks in `backend/mlblock/blocks/layers-6366F1/` continue to return `nn.Module` instances when instantiated without predecessor inputs.
