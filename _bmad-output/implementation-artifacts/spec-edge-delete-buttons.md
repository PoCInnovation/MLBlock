---
title: 'Edge delete buttons'
type: 'feature'
created: '2026-08-18'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** Edges can only be removed via keyboard selection + Delete; there is no visible affordance. Users want a delete button on top of each edge, like the React Flow Edge Toolbar example.

**Approach:** Render a small circular ✕ button at the center of each edge via `EdgeLabelRenderer` (the v11 equivalent of the v12 `EdgeToolbar`), positioned at the path midpoint measured with `getPointAtLength`. Clicking removes the edge through the same store path as the Delete key (undo point + remove change). A CSS fix anchors the `EdgeLabelRenderer` container to the viewport origin.

## Suggested Review Order

**Edge rendering**

- Entry point: delete button at path center, measured after render
  [`FlowLink.tsx:133`](../../../frontend/src/components/flow/FlowLink.tsx#L133)

- Removal uses the store path that also feeds keyboard Delete (undo included)
  [`FlowLink.tsx:147`](../../../frontend/src/components/flow/FlowLink.tsx#L147)

- Container fix: without `top/left` the renderer falls to the bottom of the viewport
  [`index.css:215`](../../../frontend/src/index.css#L215)

## Code Map

- `frontend/src/components/flow/FlowLink.tsx` -- custom edge component; now measures its path midpoint (`useLayoutEffect` + `getPointAtLength`) and renders the delete button.
- `frontend/src/index.css` -- anchors `.react-flow__edgelabel-renderer` to `top:0; left:0`; hover/focus styles for the button.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/flow/FlowLink.tsx` -- add delete button via `EdgeLabelRenderer` at path midpoint -- implements the requested affordance; removal reuses `applyFlowEdgeChanges([{id, type:'remove'}])` (same path as Delete key).
- [x] `frontend/src/index.css` -- fix `EdgeLabelRenderer` container position + hover/focus styles -- the container otherwise renders at the bottom of the viewport, offsetting all buttons.

**Acceptance Criteria:**
- Given a pipeline with edges in free view, when the editor loads, then each edge shows a ✕ button exactly at its path midpoint.
- Given grid view, when an edge routes through corridors, then the button sits on the routed path midpoint and is clickable (not covered by cards).
- Given a button click, when the user clicks ✕, then the edge is removed and the button disappears.
- Given a removal, when the user clicks Undo (Ctrl+Z), then the edge is restored.
- Given keyboard navigation, when the button is focused, then a visible focus ring appears.

## Verification

**Commands:**
- `npm run build` -- expected: type-check + bundle succeed.
- `npm test` -- expected: all 67 tests pass.

**Manual checks (no CLI):**
- DOM: button `transform` matches `getPointAtLength(totalLength/2)` mapped to screen (delta 0,0) in both views.
- Hit-test: `elementFromPoint` at button center returns the button in both views (not a card/edge).
- Delete → Undo cycle restores the edge.
