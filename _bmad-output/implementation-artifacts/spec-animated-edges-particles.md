---
title: 'Animated edges particles'
type: 'feature'
created: '2026-08-18'
status: 'done'
route: 'one-shot'
---

## Intent

**Problem:** Edges in the MLBlock editor are static lines; users want the animated SVG particle effect (a dot traveling along each edge path) demonstrated in the React Flow "Animating Edges" example, in both free and grid views.

**Approach:** Render a `<circle>` with `<animateMotion path={d}>` inside the existing custom edge component `FlowLink`, reusing the already-computed path `d` (grid routing or free-mode straight line). Color the dot like the edge, respect `prefers-reduced-motion`, stop before the arrowhead, and desynchronize dots per edge.

## Suggested Review Order

**Edge rendering**

- Entry point: custom edge component now renders the animated particle
  [`FlowLink.tsx:114`](../../../frontend/src/components/flow/FlowLink.tsx#L114)

- Reduced-motion gate + per-edge desync offset (SMIL can't be disabled via CSS)
  [`FlowLink.tsx:12`](../../../frontend/src/components/flow/FlowLink.tsx#L12)

- Particle stops before the arrowhead, starts at path origin
  [`FlowLink.tsx:120`](../../../frontend/src/components/flow/FlowLink.tsx#L120)

## Code Map

- `frontend/src/components/flow/FlowLink.tsx` -- custom edge component for both views; owns path computation `d` and now the animated particle.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/flow/FlowLink.tsx` -- add `<circle>` + `<animateMotion path={d} />` after the edge path -- implements the requested animation with the already-computed path.

**Acceptance Criteria:**
- Given a pipeline with edges, when the editor loads, then each edge shows a dot traveling along its path.
- Given grid view, when an edge routes through corridor corners, then the dot follows the full routed path.
- Given `prefers-reduced-motion: reduce`, when the editor loads, then no particle is rendered.
- Given two edges, when both animate, then their `begin` offsets differ (dots desynchronized).
- Given an edge with an arrowhead, when the dot reaches the end, then it stops before the arrowhead (no pop-back overlap).

## Verification

**Commands:**
- `npm run build` -- expected: type-check + bundle succeed.
- `npm test` -- expected: all existing tests pass (no behavior contract changed).

**Manual checks (no CLI):**
- Open editor in free view: 3 dots travel along the 3 straight edges; colors match edge colors.
- Switch to grid view: dots follow routed (curved) paths.
- DOM check: each `<animateMotion>` has `keyPoints="0;0.94"`, `begin` derived from edge id, `aria-hidden="true"` on the circle.
- Measurement over 600ms: dot position changes (animation running).
