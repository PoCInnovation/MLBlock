---
title: 'ContainerBlockNode UI & Real-Time Shape Tracker'
type: 'feature'
created: '2026-09-28'
status: 'done'
baseline_commit: '2973783fe6f9076e86e5f1ce715ba5d548bcf214'
route: 'dispatch'
review_loop_iteration: 0
context:
  - frontend/src/components/flow/ContainerBlockNode.tsx
  - frontend/src/components/flow/BlockNode.tsx
  - frontend/src/components/flow/FlowCanvas.tsx
  - frontend/src/store/useAppStore.ts
  - frontend/src/utils/shapeTracker.ts
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Although the backend supports `sequential_container` and serialization preserves children, the frontend canvas renders `sequential_container` as a standard atomic block without an internal drawer, layer stacking controls, layer reordering, or tensor dimension tracking. Users cannot visually build a PyTorch sequential model without manual wiring.

**Approach:** Implement `ContainerBlockNode.tsx` using In-Node DOM rendering with Astryx components:
1. Collapsible vertical drawer (`isExpanded`) displaying stacked layers with up/down/delete actions.
2. Layer selector popover (`+ Ajouter une couche`) filtered to `Stage.REPRESENT` layers and activations.
3. Analytical real-time Shape Tracker computing dimensions between layers (`Conv2d -> MaxPool -> Flatten -> Linear`) with mismatch warning badges.
4. Seamless Zustand store integration with `updateNodeChildren` and undo/redo points.

## Boundaries & Constraints

**Always:**
- Use In-Node DOM rendering (never ReactFlow `parentId` subflows).
- Follow Astryx design tokens and `data-theme="dark"`.
- Preserve undo/redo stack (`commitUndoPoint()`) whenever child layers are added, reordered, or removed.
- Keep ports strictly typed: input handle `in_1: Tensor`, output handle `out_1: torch.nn.Module`.

**Never:**
- Never create sub-canvases or nested ReactFlow instances.
- Never block rendering if shape inference cannot determine dimensions (gracefully display `[?]` or unconstrained).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add Layer | User clicks `+ Ajouter une couche` and selects `conv2d_layer` | New child layer appended to `node.data.children`; store commits undo point | Safe defaults for params (`out_channels: 32, kernel_size: 3`) |
| Reorder Layer | User clicks up/down arrow on layer $i$ | Layer swapped with neighbor; order updated in `children` | Boundaries (up disabled on first, down disabled on last) |
| Remove Layer | User clicks delete button on layer $i$ | Layer removed from `children`; shape tracker recalculates remaining stack | Can remove down to empty list |
| Shape Inference | Input `(3, 32, 32)` followed by `conv2d(32, k=3)`, `maxpool(2)`, `flatten`, `linear(10)` | Step badges show `[3, 32, 32] -> [32, 30, 30] -> [32, 15, 15] -> 7200 -> 10` | N/A |
| Shape Mismatch | Flatten outputs 7200 but Linear layer has `in_features=500` | Warning badge displayed on the Linear step with alert message | Suggests auto-fix to 7200 |
| Empty Container | Container with `children: []` | Empty state placeholder with "+ Ajouter une couche" call-to-action | Drawer remains expandable |

</frozen-after-approval>

## Code Map

- `frontend/src/utils/shapeTracker.ts` -- Pure shape inference engine for PyTorch layers (`Conv2d`, `MaxPool2d`, `Flatten`, `Linear`, etc.).
- `frontend/src/utils/shapeTracker.test.ts` -- Vitest unit tests verifying dimension calculations and mismatch detection.
- `frontend/src/components/flow/ContainerBlockNode.tsx` -- ReactFlow custom node with expandable drawer, layer list, and shape badges.
- `frontend/src/components/flow/BlockNode.tsx` -- Delegate `sequential_container` to `ContainerBlockNode`.
- `frontend/src/components/flow/FlowCanvas.tsx` -- Register `container: ContainerBlockNode` in `nodeTypes`.
- `frontend/src/store/useAppStore.ts` -- Add `updateNodeChildren` action with undo point support.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/utils/shapeTracker.ts` & `shapeTracker.test.ts` -- Implement pure shape calculation engine and unit tests.
- [x] `frontend/src/store/useAppStore.ts` -- Add `updateNodeChildren` action.
- [x] `frontend/src/components/flow/ContainerBlockNode.tsx` -- Build container node component with expandable drawer, layer stacking, reordering, and shape badges.
- [x] `frontend/src/components/flow/BlockNode.tsx` & `FlowCanvas.tsx` -- Register and wire container node rendering on the canvas.
- [x] Vitest & ESLint verification -- Ensure all tests pass with zero warnings.

**Acceptance Criteria:**
- Given a `sequential_container` on the canvas, when expanded, child layers are listed in vertical order with up/down/delete controls.
- Given input shape `(3, 32, 32)` with `conv2d_layer(32, k=3)` and `maxpool2d_layer(k=2)`, the shape tracker displays `[32, 30, 30]` and `[32, 15, 15]`.
- Given a dimension mismatch between `flatten_layer` and `linear_layer`, a visual warning chip indicates the expected vs actual dimension.
- Adding, moving, or removing layers commits an undo snapshot and updates the pipeline dirty state.

## Implementation Notes

- Built pure shape transformation engine `frontend/src/utils/shapeTracker.ts` with support for PyTorch 2D convolutions, max/avg pooling, flattening, linear dense layers, activations, and normalizations.
- Built unit test suite `shapeTracker.test.ts` confirming CNN CIFAR-10 shape calculation: `[3, 32, 32] -> [32, 30, 30] -> [32, 15, 15] -> 7200 -> 10`.
- Added `updateNodeChildren` action in `frontend/src/store/useAppStore.ts` with automatic `commitUndoPoint()` and undo/redo support.
- Implemented `frontend/src/components/flow/ContainerBlockNode.tsx` using Astryx components with collapsible vertical drawer, layer reordering (up/down), deletion, "+ Ajouter une couche" picker, real-time shape badge display, and mismatch warning chips.
- Integrated `ContainerBlockNode` in `frontend/src/components/flow/BlockNode.tsx` and `frontend/src/components/flow/FlowCanvas.tsx`.
- Verified all 90 vitest tests, 118 backend pytest tests, ESLint (0 warnings), and frontend production build.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd frontend && pnpm test` -- expected: all shapeTracker and existing tests pass.
- `cd frontend && pnpm exec eslint . --max-warnings 0` -- expected: zero lint warnings.
- `cd frontend && pnpm run build` -- expected: production build succeeds.
