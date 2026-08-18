---
title: 'Disposer auto-layout button'
type: 'feature'
created: '2026-08-18'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'dc96fb737c7b5e6b3e8eac41c1bb27f2caf9aaee'
context: []
---

## Intent

**Problem:** Free-mode pipelines are positioned entirely by hand (DnD, tap-to-add at canvas center with 22px offsets), so graphs with 5+ blocks become tangled: crossing edges, overlapping nodes, no hierarchical reading order. The removed grid/columns view was a crude auto-arrange; free mode has none.

**Approach:** Add a "Disposer" button to the editor canvas that re-arranges all nodes hierarchically (sources above targets, minimal crossings) using the `dagre` layout algorithm, as an explicit user-triggered action with undo support — free positioning stays the default.

## Boundaries & Constraints

**Always:** Explicit action only — never auto-run, never on load. Push an undo point before applying so Ctrl+Z restores manual positions. Use `@dagrejs/dagre` (maintained fork, ships TS types, ~30kB). Read node sizes from the DOM at click time (block heights vary: params, segments, labels). Keep edges untouched (smoothstep re-routes automatically). French UI string ("Disposer"). Reuse existing store actions (`setFlowNodes`, `commitUndoPoint`) — no store shape change. Deterministic: same graph → same layout.

**Ask First:** None expected — button placement is a custom control in the existing ReactFlow `<Controls>` cluster (bottom-left, visible on desktop and mobile, no header crowding; header already wraps at ≤900px with 6 buttons).

**Never:** No auto-layout on load or after every edit. No layout on drag. No new store fields/actions (no `layoutVersion`, no layout mode). Do NOT touch edges. No grid/columns resurrection. No node dimension estimation from catalog (segs/params heights are dynamic — measure, don't guess).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Arrange | ≥2 nodes in editor, click Disposer | Nodes re-positioned hierarchically, fitView, undo point pushed | — |
| Not enough nodes | 0 or 1 node, click Disposer | No-op, no error, no undo point | Silent no-op |
| Linear chain | A→B→C, click Disposer | Top-down ranks: B.y > A.y, C.y > B.y | — |
| Diamond | A→{B,C}→D, click Disposer | B and C on same rank (equal y), no two nodes share a position | — |
| Tall blocks | Nodes with many params/segments | DOM-measured heights, no vertical overlap | Fallback size 220×140 if a node DOM el is missing |
| Undo | Layout applied, press Ctrl+Z | Manual positions restored (snapshot includes positions) | — |
| Mobile | Touch viewport, Controls cluster visible | Same behavior, button reachable | — |

## Code Map

- `frontend/src/components/flow/FlowCanvas.tsx` -- ReactFlow render L308-326 with `<Controls />` L323; add custom `ControlButton` child (importable from 'reactflow', confirmed `export * from '@reactflow/controls'` and `ControlButton` is a styled `<button>` with `react-flow__controls-button` class). Wiring: handler reads `useAppStore.getState().flowNodes`, measures DOM (`.react-flow__node[data-id="<id>"]` rects), runs layout util, `commitUndoPoint()` → `setFlowNodes` → `fitView({ padding: 0.2, duration: 300 })`. Mirror the drop/tap patterns at L256-290 (`screenToFlowPosition`, `fitView` timer). `wrapperRef` L307.
- `frontend/src/store/useAppStore.ts` -- `flowNodes` single source of truth; `setFlowNodes(nodes)` L138; `commitUndoPoint()` L214-217 snapshots `{nodes, edges, name}` — node positions included, so undo/redo restore manual positions for free.
- `frontend/src/utils/layout.ts` -- NEW pure function: `arrangeGraph(nodes: {id, position, width, height}[], opts?) → Record<id, {x, y}>`. dagre graph with `rankdir: 'TB'`, `ranksep: 80`, `nodesep: 50` (generous for smoothstep corners, edge labels, particle animations). No DOM, no store imports — vitest-testable in node env.
- `frontend/src/utils/layout.test.ts` -- NEW vitest tests (mirror `tapGuard.test.ts` — pure, no jsdom): chain top-down, diamond same-rank, determinism, no-collision, fallback.
- `frontend/package.json` -- add `@dagrejs/dagre` dependency (npm install).
- `frontend/src/components/flow/BlockNode.tsx` -- variable height source (params segments, min-w 180 / max-w 260 card L68) — justifies DOM measurement over fixed estimates.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- `npm install @dagrejs/dagre` -- layout algorithm, ships TS types
- [x] `frontend/src/utils/layout.ts` -- pure `arrangeGraph()` wrapping dagre (TB, ranksep 80, nodesep 50) -- testable, deterministic
- [x] `frontend/src/utils/layout.test.ts` -- unit tests: chain top-down, diamond same-rank, determinism, no shared positions -- I/O matrix edge cases
- [x] `frontend/src/components/flow/FlowCanvas.tsx` -- ControlButton "Disposer" in `<Controls>`; handler: <2 nodes → no-op, else measure DOM sizes → arrangeGraph → commitUndoPoint → setFlowNodes → fitView -- explicit action + undo

**Acceptance Criteria:**
- Given an editor with ≥2 connected nodes, when the user clicks Disposer, then every node position changes and the pipeline is arranged with sources above targets, no overlapping nodes, and edges keep their topology.
- Given a linear chain A→B→C, when arranged, then B.y > A.y and C.y > B.y.
- Given a diamond A→{B,C}→D, when arranged, then B.y = C.y and all node positions are distinct.
- Given a layout applied, when the user presses Ctrl+Z, then the pre-layout manual positions are restored.
- Given 0 or 1 node, when the user clicks Disposer, then nothing changes and no error appears.
- Given the same graph twice, when arranged twice, then the two layouts are identical.
- Given the mobile viewport, when the editor loads, then the Disposer control is visible in the Controls cluster and works on tap.

## Spec Change Log

## Design Notes

- dagre (Sugiyama: layering → ordering → coordinates) gives readable hierarchies the removed columns view lacked: crossing minimization, aligned ranks. The reactflow docs example uses fixed nodeWidth/nodeHeight — MLBlock blocks are variable-height, so sizes come from `getBoundingClientRect()` at click time (all nodes are mounted when the user clicks; px sizes are scale-independent in flow coords).
- Button placement: custom `ControlButton` child of `<Controls>` (bottom-left). Rationale: header-actions already holds 6 buttons and wraps at ≤900px; a 7th forces a third row at 375px. The Controls cluster is standard, visible on mobile, zero layout churn.
- Undo: `commitUndoPoint()` snapshots `flowNodes` (positions included) — reusing it gives undo/redo of the arrange for free, consistent with delete/connect/drop gestures.

## Verification

**Commands:**
- `npm test` -- expected: existing 46 tests + new layout tests pass
- `npm run build` -- expected: type-check + bundle succeed

**Manual checks (no CLI):**
- Editor with the 3-node demo pipeline: click Disposer → chain arranged top-down, edges re-routed, fitView applied.
- Ctrl+Z restores manual positions.
- Drag a node then click Disposer again → deterministic same layout for same graph.
- Mobile viewport 375px: Disposer visible in Controls cluster, tap works.

## Suggested Review Order

**Layout algorithm (pure core)**

- dagre wrapper: TB ranks, generous spacing, center→top-left conversion, invalid-edge filtering
  [`layout.ts:25`](../../frontend/src/utils/layout.ts#L25)

- Unit tests: chain/diamond/variable-height/disconnected/determinism/center-alignment
  [`layout.test.ts:69`](../../frontend/src/utils/layout.test.ts#L69)

**Editor wiring**

- handleArrange: rAF-measured DOM sizes, zoom correction, 1px no-op skip, undo commit
  [`FlowCanvas.tsx:308`](../../frontend/src/components/flow/FlowCanvas.tsx#L308)

- Timer cleanup on unmount (fitView after 50ms)
  [`FlowCanvas.tsx:344`](../../frontend/src/components/flow/FlowCanvas.tsx#L344)

- Disposer ControlButton in the Controls cluster, disabled <2 nodes
  [`FlowCanvas.tsx:381`](../../frontend/src/components/flow/FlowCanvas.tsx#L381)
