---
title: 'Right sidebar toggle Cours / Inspecteur'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 1
baseline_commit: '69e41d0141eba584a22a99f108bb5873b4f5a80f'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Right sidebar currently only shows Inspecteur (or requires manual code to show courses). For SEO/GEO and learning, the same panel must host two distinct jobs — guided Course (step-by-step) and live per-block Inspecteur — selectable by the user without touching the left palette.

**Approach:** Add a manual, instant French toggle in the right sidebar only (default `Inspecteur`) using Astryx `ToggleButtonGroup` (`Cours | Inspecteur`), with a badge dot on `Inspecteur` when `job_outputs` exist. Left sidebar stays untouched.

## Boundaries & Constraints

**Always:** Right sidebar only; left `FlowPalette` untouched; French labels `Cours`/`Inspecteur`/`Replier`; instant switch (`transition: none`, `display` toggle, no animation); default `Inspecteur`; badge visible only after run; Astryx `ToggleButtonGroup` `type="single"` with `Grid columns={2}` if needed; keep `@xyflow/react` canvas and Zustand store untouched.

**Ask First:** Changing default to `Cours`, adding URL `?panel=` deep-link, moving toggle to header outside sidebar, changing `ToggleButtonGroup` to `SegmentedControl`.

**Never:** Animate the toggle (per previous instant request); touch left sidebar or `BlockNode` cards; add backend/DB changes in this story; auto-switch on block click (manual only).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Toggle render | Right sidebar mounted, default | Shows `ToggleButtonGroup` with `Cours`/`Inspecteur`, `Inspecteur` pressed, no badge | Missing `ToggleButtonGroup` → fallback to buttons |
| Switch to Cours | Click `Cours` | Right panel shows Course placeholder/catalog (future), `Cours` pressed, `Inspecteur` not pressed | No course selected → show empty `Aucun cours sélectionné` French |
| Switch to Inspecteur | Click `Inspecteur` | Shows `Inspecteur` placeholder `Sélectionne un bloc`, pressed | `catalog` null → `Inspecteur` still renders placeholder |
| Badge | After `job_outputs` for job exists | `Inspecteur` shows dot `•` or `•3` | No outputs → no badge, no error |
| Build | `npm run build` | `tsc --noEmit && vite build` succeeds | Layer clash → Tailwind wins |

</frozen-after-approval>

## Code Map

- `frontend/src/components/flow/FlowCanvas.tsx:464` -- Right sidebar shell `width: rightCollapsed ? 48 : 260` `flexDirection: column` `overflow hidden position relative transition none` -- outer wrapper with `display` toggle for collapsed vs expanded, inner `InspectorPanel` vs `Cours` panel, `IconButton` at `top left` inside `Inspecteur` / centered when collapsed. To be extended with `ToggleButtonGroup` header.
- `frontend/src/components/flow/FlowPalette.tsx:1` -- Left palette (untouched reference) uses `ToggleButtonGroup` `type="single"` `Grid columns={2} gap={1.5}` with `categories` + `search` -- pattern to reuse for right toggle.
- `frontend/node_modules/@astryxdesign/core/dist/ToggleButton/ToggleButtonGroup.d.ts:31` -- `ToggleButtonGroup` `type single|multiple` `value string|null` `onChange (v)=>void` `label` `orientation horizontal|vertical` `size` `xstyle`, context `ToggleButtonGroupContext`, `ToggleButton value` required, `isPressed`/`size` controlled by group.
- `frontend/node_modules/@astryxdesign/core/dist/ToggleButton/ToggleButton.d.ts:31` -- `ToggleButton` `label`, `value`, `icon`, `variant`, `size`, `isDisabled`, `isPressed` (group controlled).
- `frontend/src/components/flow/BlockNode.tsx:1` -- Canvas nodes remain `@xyflow/react` Handles, not touched by this toggle story.

## Tasks & Acceptance

**Execution:**
- [ ] `frontend/src/components/flow/FlowCanvas.tsx:464` -- replace right sidebar header `Inspecteur` title-only with `ToggleButtonGroup` `type="single"` `label="Mode"` `value={rightMode}` `onChange={setRightMode}` `size="sm"` containing `<ToggleButton label="Cours" value="cours" />` + `<ToggleButton label="Inspecteur" value="inspecteur" />` (French) inside a `Stack`/`HStack` header with `IconButton` replier at top-left (keep instant). Default `rightMode="inspecteur"` via `useState`. Keep `transition: none` and `display` toggle for collapsed/expanded.
- [ ] `frontend/src/components/flow/FlowCanvas.tsx:523` -- `InspectorPanel` stays as `inspecteur` branch; add `Cours` branch placeholder `VStack` with `Text` `Aucun cours sélectionné` + search/cat placeholder (no catalog logic in this story, just shell). Wire `rightMode` to conditional `rightMode==="cours" ? <CoursPlaceholder/> : <InspectorPanel/>`.
- [ ] `frontend/src/components/flow/FlowCanvas.tsx` -- add badge dot logic: `const hasOutputs = useAppStore(s=> s.jobOutputs?.length>0)` or `flowNodes.some(...)` placeholder; when `hasOutputs && rightMode!=="inspecteur"` show dot via `ToggleButton` `icon` or `Badge` next to `Inspecteur` label; instant, no polling in this story, just prop.

**Acceptance Criteria:**
- Given right sidebar, when mounted, then `ToggleButtonGroup` shows `Cours`/`Inspecteur`, `Inspecteur` is pressed by default, French labels, instant switch (no 200ms).
- Given click `Cours`, when toggled, then right panel shows `Cours` placeholder and `Cours` pressed; click `Inspecteur` restores `Inspecteur`.
- Given `npm run build`, when building, then `tsc --noEmit && vite build` succeeds and no `ToggleButtonGroup` type errors.
- Given left `FlowPalette` filters, when used, then left still shows `Grid columns={2}` categories and `Tous` pressed, no regression.
- Given `npm test`, when running, then 53 tests pass.

## Spec Change Log

## Design Notes

Toggle is manual per user decision: Course secondary usage, Inspecteur primary. Badge dot signals when per-block outputs exist (future `job_outputs` wiring). URL `?panel=` deep-link is Could, not Must in this story. Keep `rightCollapsed` 48↔260 logic; toggle lives *inside* expanded panel header, collapsed shows centered `IconButton` to reopen (existing instant pattern). Use `ToggleButtonGroup` not `SegmentedControl` to match left palette.

## Verification

**Commands:**
- `npm --prefix frontend run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, no ToggleButtonGroup prop errors
- `npm --prefix frontend test -- --run` -- expected: 53 passed
- `uv run ruff check .` -- expected: pass
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/editor`, verify right header shows `Cours | Inspecteur` toggle, default `Inspecteur`, instant switch, French labels, badge hidden when no outputs
- Click `Cours`, verify placeholder, click `Inspecteur`, verify `Sélectionne un bloc` returns, collapse/expand right still instant via `IconButton` top-left
- Check left palette still ToggleButtonGroup `Tous`/`Activation` with Grid, no regression

## Suggested Review Order

**Entry — Right toggle shell**
- Instant French Toggle Cours/Inspecteur default Inspecteur
  [`FlowCanvas.tsx:475`](../../frontend/src/components/flow/FlowCanvas.tsx#L475)

**State & badge**
- rightMode useState + hasOutputs badge dot
  [`FlowCanvas.tsx:85`](../../frontend/src/components/flow/FlowCanvas.tsx#L85)

**Panel switch**
- Conditional CoursPlaceholder vs InspectorPanel
  [`FlowCanvas.tsx:525`](../../frontend/src/components/flow/FlowCanvas.tsx#L525)

**Peripherals**
- Build and test verification
  [`FlowCanvas.tsx:1`](../../frontend/src/components/flow/FlowCanvas.tsx#L1)
