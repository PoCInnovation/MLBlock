---
title: 'Mobile-first responsive support'
type: 'feature'
created: '2026-08-18'
status: 'done'
review_loop_iteration: 0
baseline_commit: '5d11df592a1e1144b53047ed02d76398ead2a365'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** MLBlock is desktop-first: the editor shell is fixed-px (260px palette, 60px header, 196px console, 14px handles), the landing nav has no mobile menu, modals have fixed widths, and the only responsive rule is a single 768px landing fallback. Touch devices cannot create nodes (HTML5 DnD), and small screens overflow horizontally.

**Approach:** Make the whole site mobile-first: responsive landing (hamburger nav, stacking grids), fluid editor shell (collapsible palette as overlay on mobile, wrapping header, viewport-clamped modals), and touch editing (tap-to-add from palette, tappable handles ≥22px, `connectOnClick` already enabled by default in reactflow v11).

## Boundaries & Constraints

**Always:** Free mode only (grid view removed). Keep all existing behavior on desktop unchanged (DnD, keyboard, undo/redo, unsaved-changes guard, fingerprint semantics). French UI strings. Tailwind v4 utilities + `theme.ts` tokens; no new dependencies. React 18 + reactflow 11 (v11 API only — `EdgeToolbar`/`NodeToolbar` don't exist; use CSS/inline styles). `connectOnClick` already defaults to `true` in v11 (verified node_modules/@reactflow/core/dist/esm/index.mjs:3818) — no prop needed, keep handles in DOM for edge anchoring.

**Ask First:** Palette behavior on mobile — overlay drawer with a toggle button (recommended) vs bottom sheet. Mobile console panel — collapsible via tab vs always bottom.

**Never:** Do NOT add a mobile UI library. Do NOT change the store shape (no `viewMode`/columns resurrection). Do NOT break the `beforeunload`/stash guard. No backend changes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Touch tap-to-add | User taps a palette item on mobile | Node added at center of visible viewport | Same dedup/id rules as DnD drop |
| Small screen editor | Width < 768px | Palette hidden, toggle button opens overlay; header wraps to 2 rows | Overlay closes on backdrop tap |
| Desktop editor | Width ≥ 768px | Current fixed layout unchanged | — |
| Modal on tiny screen | Export (340px) / SampleData (480px) | Width clamped to viewport (`max-w-[calc(100vw-32px)]`) | Scroll inside modal |
| Landing nav mobile | Width < 768px | Hamburger toggles link menu; current links hidden | Menu closes on link tap |

</frozen-after-approval>

## Code Map

- `frontend/src/components/flow/FlowCanvas.tsx` -- root row: palette + canvas + console (L250); ReactFlow props L253-270 (fitView, Controls, MiniMap, Background, connectionRadius 40); onDrop uses `screenToFlowPosition` (L254) — reuse for tap-to-add center placement; `onDragStart` (L236) HTML5 DnD — tap path needs an onClick alternative.
- `frontend/src/components/flow/FlowPalette.tsx` -- fixed 260px sidebar (L6-15), items `draggable` + `onDragStart` (L167-168) — add `onClick` tap-to-add; needs `onAdd` prop; overlay wrapper lives here or in FlowCanvas.
- `frontend/src/components/editor/EditorHeader.tsx` -- fixed 60px (L82), ghostBtn minHeight 44 (L21), buttons L116-198; project-name input width 180 (L103); wrap on mobile via flex-wrap + height auto.
- `frontend/src/components/landing/HomeNav.tsx` -- flex nav L37, links L50-67, no mobile menu; add hamburger + collapsible menu under 768px.
- `frontend/src/components/flow/BlockNode.tsx` -- handle classes `w-[14px]! h-[14px]!` (L14-15) — enlarge on touch (media query); card min-w-[180px] max-w-[260px] (L68).
- `frontend/src/components/ui/*` -- dialog.tsx already vw-clamped (w-[400px] max-w-[calc(100vw_-_32px)]); ExportModal fixed 340 (L9-16); SampleDataModal fixed 480 (L7-15); EditorUnavailableModal width 90% (L12); Toast maxWidth 380 (L6-23) — clamp Export/SampleData.
- `frontend/src/index.css` -- single 768px media block L172-179 (landing only); `.react-flow__handle:hover scale 1.6` L203; add touch handle sizing + editor responsive rules here (outside layers, matching existing pattern L198-215).
- `frontend/index.html` -- viewport meta present (L5), zoom allowed — keep.
- `frontend/src/pages/ProjectsPage.tsx` -- standalone `px-8 py-12` (L15), grid auto-fill minmax(260px,1fr) (L27) — mobile padding.
- `frontend/src/components/ui/ConsolePanel.tsx` -- absolute bottom overlay left/right 18 height 196 (L30-35), returns null if empty (L27).

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/flow/FlowPalette.tsx` + `FlowCanvas.tsx` -- add tap-to-add (`onClick` → `onAdd(type)`, node at `screenToFlowPosition` of canvas center) -- touch devices can't HTML5-drag.
- [x] `frontend/src/components/flow/FlowPalette.tsx` + `FlowCanvas.tsx` -- mobile: palette hidden <768px, toggle button (e.g. hamburger in canvas corner) opens palette as fixed overlay with backdrop; desktop unchanged -- editor usable on phones.
- [x] `frontend/src/components/editor/EditorHeader.tsx` -- mobile: flex-wrap + auto height, project-name input shrinks (`width: min(180px, 30vw)`), keep Undo/Redo/Save/Lancer visible -- header fits 375px width.
- [x] `frontend/src/index.css` -- `@media (max-width: 767px)` block: `.react-flow__handle` ≥22px (width/height + hit area), palette/console overlay rules; `@media (pointer: coarse)` for handle sizing -- tappable targets (WCAG 2.5.5).
- [x] `frontend/src/components/landing/HomeNav.tsx` + `index.css` -- hamburger <768px toggling the 5 nav links (Découvrir/Comment ça marche/Qui sommes nous/Mes projets + auth), close on link tap -- landing usable on phones.
- [x] `frontend/src/components/ui/ExportModal.tsx` + `SampleDataModal.tsx` -- clamp width to `calc(100vw - 32px)` -- modals fit small screens.
- [x] `frontend/src/pages/ProjectsPage.tsx` -- mobile padding (`px-4 py-8` <768px), grid already auto-fill -- project list fits phones.
- [x] `frontend/src/components/ui/ConsolePanel.tsx` -- mobile: height auto (max 40vh) + collapsible tab -- results readable on phones.

**Acceptance Criteria:**
- Given a touch device (or Chrome DevTools mobile emulation, width 375px), when the editor loads, then no horizontal overflow occurs (document scrollWidth ≤ viewport width).
- Given a touch device, when the user taps a palette item, then a node appears at the canvas center and the palette overlay closes.
- Given a touch device, when the user taps two handles in a row, then an edge is created (`connectOnClick` default true; handles stay in DOM).
- Given a touch device, when the editor loads, then handles are ≥22px on screen (pointer: coarse).
- Given desktop ≥768px, when the editor loads, then the current fixed layout renders unchanged (palette sidebar visible, no hamburger).
- Given a 375px viewport on any page, when the page renders, then no horizontal scrollbar appears.
- Given a mobile nav menu, when the user taps a link, then the menu closes and navigation proceeds.

## Spec Change Log

## Design Notes

- `connectOnClick` (v11 default true) already gives tap-tap connect; the only touch gaps are handle size and hit area — enlarge via CSS, don't rework handles.
- Tap-to-add reuses the same node-construction code as `onDrop` in FlowCanvas (L266-283) — extract a shared `buildNode(type, position)` helper to avoid duplication.
- Palette overlay: render the existing `FlowPalette` in a `position: fixed` wrapper with backdrop inside FlowCanvas, controlled by local state — no store change, no z-index fight with ReactFlow panes (backdrop z-40, content z-50).
- Keep desktop DnD intact: `draggable` stays; `onClick` on mobile fires after tap (no drag) — guard with a `pointer: coarse` media check or a small drag-distance threshold to avoid desktop click-after-drag.

## Verification

**Commands:**
- `npm run build` -- expected: type-check + bundle succeed.
- `npm test` -- expected: all existing tests pass (no store/API change).

**Manual checks (no CLI):**
- Chrome DevTools device toolbar, iPhone 14 (390×844): editor — no overflow, tap palette item adds node, tap-tap connect works, handles ≥22px, console collapsible, header wraps.
- Same emulation: landing pages — hamburger menu opens/closes, no horizontal scroll on Home/HowItWorks/About/Login/Register/Projects.
- Desktop 1440px: layout identical to pre-change (palette visible, DnD still works, no hamburger).
- Modals Export/SampleData at 320px width: fit with 32px margin, scroll internally.

## Suggested Review Order

**Touch editing**

- Shared node builder + center placement with per-tap offset (no stacking)
  [`FlowCanvas.tsx:106`](../../frontend/src/components/flow/FlowCanvas.tsx#L106)

- Mobile-only tap-to-add: drawer passes onAdd, desktop sidebar doesn't; dragStarted suppresses post-drag clicks
  [`FlowPalette.tsx:116`](../../frontend/src/components/flow/FlowPalette.tsx#L116)

- Tap-vs-drag guard extracted and unit-tested
  [`tapGuard.ts:9`](../../frontend/src/utils/tapGuard.ts#L9)

**Responsive editor shell**

- Mobile palette drawer with dialog semantics, focus management, Escape, ✕ close
  [`FlowCanvas.tsx:331`](../../frontend/src/components/flow/FlowCanvas.tsx#L331)

- Header wraps ≤900px, name truncates only on mobile
  [`EditorHeader.tsx:103`](../../frontend/src/components/editor/EditorHeader.tsx#L103)

- Console collapsible with height switch + autoscroll re-run on expand
  [`ConsolePanel.tsx:33`](../../frontend/src/components/ui/ConsolePanel.tsx#L33)

**Touch targets**

- Handles ≥22px under pointer:coarse, inside @layer for cascade precedence
  [`index.css:313`](../../frontend/src/index.css#L313)

- Media blocks: 900px header wrap / 767px palette+nav switch
  [`index.css:246`](../../frontend/src/index.css#L246)

**Landing mobile nav**

- Hamburger + collapsible menu with Escape/outside-tap dismissal and desktop reset
  [`HomeNav.tsx:116`](../../frontend/src/components/landing/HomeNav.tsx#L116)

**Modals & pages**

- Export/SampleData width clamped to viewport
  [`ExportModal.tsx:15`](../../frontend/src/components/ui/ExportModal.tsx#L15)
