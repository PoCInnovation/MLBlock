---
title: 'Floating editor — rounded, centred, animated'
type: 'feature'
status: 'done'
review_loop_iteration: 1
context: []
baseline_commit: 'b07e807a107298b37b043d0c1c35e23cb3f2c589'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Editor (`/editor`) layout is flat, full-bleed panels — palette, inspector, console butt against viewport edges. User wants floating, rounded, centred, animated design per Excalidraw (left: top bar + left palette + right inspector + bottom console all floating rounded 20px centered; right: minimal floating squares).

**Approach:** Redesign `EditorPage` to floating layout: outer outer container centered (`maxWidth 1440`, `margin 0 auto`, `padding 16`), inner `FlowCanvas` centered flex-1 with rounded 20px border + shadow. Top bar, left palette, right inspector, bottom console become floating `Card`/`Stack` panels (`borderRadius 20`, `boxShadow: 0 8px 32px rgba(0,0,0,.12)`, `backdropFilter: blur(8px)`), gap 16. Add enter/exit animations (CSS `transition: transform .2s ease, opacity .2s ease` + `framer-motion` if available, else CSS). Keep all existing logic (Disposer, handles 24px, Zustand, TanStack Router validateSearch).

## Boundaries & Constraints

**Always:** Keep React 19 + `@xyflow/react 12` + Astryx `Card`/`Stack`/`Button` where applicable; keep `FlowCanvas` `ReactFlow` logic, `BlockNode` handles ≥22px (`pointer: coarse` 24px), `Disposer` dagre, Zustand store, `beforeLoad` auth, `useBlocker` guard; keep `render.yaml` static; use `framer-motion` only if already installed else CSS transitions; preserve French labels.

**Ask First:** Adding `framer-motion` dependency; changing canvas interaction (pan/zoom) behavior; changing palette drawer breakpoint (<768px).

**Never:** Rewrite `FlowCanvas` ReactFlow logic; touch backend; change `routeTree` or auth flow; introduce new package manager.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Editor load | `/editor?pipeline=uuid` floating layout | Outer centered container, FlowCanvas rounded 20px, 4 floating panels visible, no layout shift | Missing panel data → panel still renders empty, no crash |
| Palette toggle (mobile) | Tap palette button (<768px) | Left panel slides in `transform: translateX(0)` with opacity, backdrop blur; desktop always visible | Resize to desktop → panel snaps to floating, no stuck hidden |
| Inspector empty | No node selected | Right panel shows placeholder "Sélectionne un bloc", still floating rounded | Selecting node → inspector content animates in (opacity) |
| Console collapsed | Bottom panel toggle | Bottom console animates height `0 → 180px`, canvas recenters | Rapid toggle → no animation queue jank (cancel previous) |
| Resize window | Viewport 1440→768 | Outer padding 16→8, panels stack or hide per mobile-first rules, canvas remains centered | <900px header wraps (existing), floating panels don't overflow viewport |
| Animation reduce | `prefers-reduced-motion: reduce` | Transitions disabled (`transition: none`), panels appear instantly | No SMIL, respect media query |

</frozen-after-approval>

## Code Map

- `frontend/src/pages/EditorPage.tsx` -- main layout: wrap `FlowCanvas` + `EditorHeader` + `FlowPalette` + `Inspector` + `ConsolePanel` in centered flex container, floating Card panels, animated mount
- `frontend/src/components/flow/FlowCanvas.tsx` -- canvas container: rounded 20px, shadow, centered, floating `Controls` cluster with `ControlButton` Disposer, `MiniMap` floating bottom-right rounded
- `frontend/src/components/editor/EditorHeader.tsx` -- top bar floating Card (`borderRadius 20`, `backdropFilter`), keep actions (Save/Play/Import)
- `frontend/src/components/flow/FlowPalette.tsx` -- left palette floating Card, width 280, gap 16, slide animation, mobile drawer behavior preserved
- `frontend/src/components/flow/BlockNode.tsx` -- keep, but ensure `Card size sm` still renders inside floating palette context
- `frontend/src/components/ui/ConsolePanel.tsx` -- bottom console floating Card, height animated, collapse toggle
- `frontend/src/index.css` -- add `@layer components` floating panel utilities (`.floating-panel { border-radius:20px; box-shadow:0 8px 32px rgba(0,0,0,.12); backdrop-filter:blur(8px); }`), `@media (pointer: coarse)` handles already 24px, keep
- `frontend/src/theme.ts` -- add `radius.xl: 20` if missing, use for floating panels
- `frontend/src/components/landing/SiteLayout.tsx` -- reference for Stack vertical gap, keep

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/pages/EditorPage.tsx` -- wrap layout in centered outer (`maxWidth 1440, margin 0 auto, padding 16, display flex flex-col gap 16, minHeight 100vh`), FlowCanvas container `flex:1 borderRadius 20 overflow hidden boxShadow 0 8px 32px`, header/palette/inspector/console as floating Card panels
- [x] `frontend/src/components/flow/FlowCanvas.tsx` -- canvas wrapper rounded 20, Controls/MiniMap floating rounded, keep Background/Disposer
- [x] `frontend/src/components/editor/EditorHeader.tsx` -- top bar Card floating (`backdropFilter blur(8px)`), gap 16, keep actions
- [x] `frontend/src/components/flow/FlowPalette.tsx` -- left floating Card width 280, slide `transform` + `opacity` transition, mobile drawer preserved
- [x] `frontend/src/components/ui/ConsolePanel.tsx` -- bottom floating Card animated height, toggle, keep logs
- [x] `frontend/src/index.css` -- add `.floating-panel` utility, ensure `@layer` order keeps utilities last
- [x] `frontend/src/theme.ts` -- ensure `radius.xl: 20` for panels
**Acceptance Criteria:**
- Given `/editor` renders, when inspecting, then outer container centered maxWidth 1440, FlowCanvas rounded 20px with shadow, 4 panels floating with gap 16 and backdrop blur
- Given palette toggle on mobile (<768px), when tapping, then left panel slides with transform/opacity, no jank, respects `prefers-reduced-motion`
- Given no node selected, when viewing inspector, then placeholder shows, selecting node animates content in
- Given bottom console toggle, when clicking, then height animates 0↔180px and canvas recenters
- Given `npm run build` after redesign, when building, then `tsc --noEmit && vite build` succeeds
- Given `npm test`, when running, then 53 tests still pass (no logic changed)
- Given `npm run lint -- --max-warnings 0`, when linting, then 0 errors

## Spec Change Log

## Design Notes

Excalidraw shows two variants: left full (top bar + left 280 + right 260 + bottom 180 + center canvas) all floating rounded, right minimal (small squares). Implement left variant as default. Use Astryx `Card` for panels (`padding 4` for content), `Stack` for gaps. Animation: CSS `transition: transform 200ms ease, opacity 200ms ease` + `will-change: transform, opacity`; if `framer-motion` installed use `<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>`, else CSS. Centered: outer `display:flex; justify-content:center; align-items:stretch` with inner `width: min(1440px, 100% - 32px)`.

## Verification

**Commands:**
- `npm run build` -- expected: `tsc --noEmit` passes, Vite builds dist, no CSS errors
- `npm test` -- expected: 53 passed
- `npm run lint -- --max-warnings 0` -- expected: 0 errors
- `uv run ruff check .` -- expected: pass
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/editor` at 1440px and 768px, verify floating panels, rounded 20, centered, animated
- Toggle palette/inspector/console, verify smooth transitions and no overflow
- Check handles still 24px on `pointer: coarse` and Disposer still layouts

## Suggested Review Order

**Floating layout — outer + canvas**

- Outer centered container maxWidth 1440 gap16 rounded 20
  [`EditorPage.tsx:1`](../../frontend/src/pages/EditorPage.tsx#L1)

- Canvas wrapper rounded 20 shadow backdrop blur (floating-canvas)
  [`FlowCanvas.tsx:35`](../../frontend/src/components/flow/FlowCanvas.tsx#L35)

- Controls/MiniMap floating rounded 20
  [`FlowCanvas.tsx:410`](../../frontend/src/components/flow/FlowCanvas.tsx#L410)

**Panels — header/palette/console**

- Header floating Card backdrop blur
  [`EditorHeader.tsx:75`](../../frontend/src/components/editor/EditorHeader.tsx#L75)

- Palette floating Card width 280 slide transform
  [`FlowPalette.tsx:8`](../../frontend/src/components/flow/FlowPalette.tsx#L8)

- InspectorPanel placeholder + animated opacity (right 260)
  [`FlowCanvas.tsx:484`](../../frontend/src/components/flow/FlowCanvas.tsx#L484)

- ConsolePanel floating collapsible height 48↔180
  [`ConsolePanel.tsx:29`](../../frontend/src/components/ui/ConsolePanel.tsx#L29)

**Styling — tokens + layers**

- Floating-panel utilities + prefers-reduced-motion
  [`index.css:321`](../../frontend/src/index.css#L321)

- Theme radius.xl 20
  [`theme.ts:1`](../../frontend/src/theme.ts#L1)
