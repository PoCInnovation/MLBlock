---
title: 'Migrate non-canvas UI to Astryx'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '54e117d668710d049b256ec98df183bc63726839'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** MLBlock non-canvas UI (landing, auth forms, modals, buttons, cards, fields) uses Base UI + hand-rolled Tailwind. After React 19 upgrade, Astryx XDS (150+ comps, MIT, 7 themes, CLI+MCP) is now adoptable to standardize this surface.

**Approach:** Migrate all non-canvas UI to Astryx: install `@astryxdesign/core`, import pre-built CSS, replace Base UI `Dialog`/`DropdownMenu` and hand-rolled `Card`/`Field`/`Button` with Astryx equivalents (`Dialog`, `AlertDialog`, `Card`, `Button`, `FormLayout`, `Table` where used). Keep ReactFlow canvas (`FlowCanvas`/`BlockNode`/`FlowLink`) and Zustand store untouched. Preserve French labels and existing routes (TanStack Router).

## Boundaries & Constraints

**Always:** Keep React 19 + `@xyflow/react 12` + TanStack Router (already shipped); keep canvas `FlowCanvas`/`BlockNode`/`FlowLink` untouched; keep single Zustand store; keep `render.yaml` static; use Context7 for Astryx docs (`xds_search`/`xds_get`); import Astryx CSS once in `main.tsx`; ensure Tailwind `className` overrides still work via `@layer` ordering.

**Ask First:** Changing theme tokens (`defineTheme`), adding `swizzle` eject, changing Vite/Tailwind major versions, touching `FlowCanvas` canvas nodes.

**Never:** Rewrite canvas nodes with Astryx; introduce new package manager; change backend; migrate to Astryx inside `FlowCanvas` param editing (segment-driven).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Landing page render | `/` with Astryx | `SiteLayout`/`Hero`/`HomeNav` render with Astryx `Stack`/`Button`/`Card`, no Tailwind clash | CSS `@layer` conflict → fallback to previous Tailwind, log warning |
| Auth form | `/login` with Astryx `FormLayout`+`Button` | `isLoading` spinner on submit, `clickAction` async, validation via `zodResolver` still works | Submit error → `FieldError` shows, button not stuck loading |
| Dialog open | `ExportModal` Astryx `Dialog` `isOpen=true` | Modal centered, `onOpenChange` closes, focus trap works, no Base UI | `isOpen` false → no render, `onOpenChange` called with false |
| Card grid | `ProjectsPage` Astryx `Card` list | Cards bordered elevated, variants `default`/`muted` work, `ClickableCard` navigates | Missing `label` → console warn, card still renders |
| Tailwind override | Astryx `Button` with `className="bg-red-500"` | Tailwind class wins via `@layer` order | Conflict → Astryx style wins, document layer order fix |

</frozen-after-approval>

## Code Map

- `frontend/package.json` -- add `@astryxdesign/core` (MIT), keep `react@19.2.8`/`@xyflow/react@12`, remove `reactflow` if still present, keep `react-router` deps
- `frontend/src/main.tsx` -- import Astryx pre-built CSS (`import '@astryxdesign/core/style.css'`), wrap app with `InternationalizationProvider` if needed, keep `RouterProvider` + `QueryClient`
- `frontend/src/theme.ts` + `frontend/src/index.css` -- map Tailwind `@theme` tokens to Astryx CSS vars or keep Tailwind alongside with explicit `@layer` order (`@layer astryx, tailwind, base`)
- `frontend/src/components/ui/dialog.tsx` -- replace Base UI `Dialog` wrapper with Astryx `Dialog`/`AlertDialog` (`isOpen`/`onOpenChange`/`title`/`description`)
- `frontend/src/components/ui/dropdown-menu.tsx` -- replace Base UI `DropdownMenu` with Astryx `DropdownMenu`/`CommandPalette` if applicable
- `frontend/src/components/ui/card.tsx` + `field.tsx` -- replace hand-rolled with Astryx `Card`/`FormLayout`/`Field`
- `frontend/src/components/landing/SiteLayout.tsx` + `HeroSection.tsx` + `HomeNav.tsx` -- replace `Stack`/`VStack` layout with Astryx `Stack`/`FormLayout`, buttons with `Button` (`variant: primary/secondary/ghost/destructive`)
- `frontend/src/pages/LoginPage.tsx` + `RegisterPage.tsx` -- wrap forms with Astryx `FormLayout`, buttons `Button` (`isLoading`/`clickAction`), keep `react-hook-form`/`zodResolver`
- `frontend/src/pages/AboutPage.tsx` + `HowItWorksPage.tsx` + `ProjectsPage.tsx` -- cards/grids to Astryx `Card`/`ClickableCard`/`Table` where applicable
- `frontend/src/components/ui/ExportModal.tsx` + `SampleDataModal.tsx` -- migrate `Dialog` to Astryx, keep `downloadFile` logic
- `frontend/src/components/blocks/BlockSegments.tsx` -- keep segment logic, wrap containers with Astryx `Card`/`Field` only
- `frontend/vite.config.ts` -- no change (Astryx simple path needs no plugin), verify `tanstackRouter` still builds

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- install `@astryxdesign/core`, run `npm install` (Context7: `xds_search`/`xds_get` for install docs)
- [x] `frontend/src/main.tsx` -- import Astryx CSS, add providers if needed, verify no double CSS layer conflict
- [x] `frontend/src/theme.ts` + `index.css` -- ensure Tailwind `className` overrides win via `@layer` ordering
- [x] `frontend/src/components/ui/dialog.tsx` -- migrate to Astryx `Dialog`/`AlertDialog` (props `isOpen`/`onOpenChange`/`title`)
- [x] `frontend/src/components/ui/dropdown-menu.tsx` -- migrate to Astryx `DropdownMenu`/`CommandPalette`
- [x] `frontend/src/components/ui/card.tsx` + `field.tsx` -- migrate to Astryx `Card`/`FormLayout`/`Field`
- [x] `frontend/src/components/landing/*` -- migrate `SiteLayout`/`Hero`/`HomeNav` layouts and buttons to Astryx
- [x] `frontend/src/pages/LoginPage.tsx` + `RegisterPage.tsx` -- migrate auth forms to `FormLayout`+`Button` (keep RHF+zod)
- [x] `frontend/src/pages/AboutPage.tsx` + `HowItWorksPage.tsx` + `ProjectsPage.tsx` -- migrate grids/cards to Astryx where applicable
- [x] `frontend/src/components/blocks/BlockSegments.tsx` -- wrap with Astryx containers only, keep segment logic

**Acceptance Criteria:**
- Given `npm run build`, when building, then `tsc --noEmit && vite build` succeeds and no Tailwind/Astryx `@layer` conflict breaks layout
- Given `/` landing, when rendering, then Astryx `Button`/`Card`/`Stack` visible, Tailwind `className` overrides still apply
- Given `/login` submit, when clicking `Button` `isLoading`, then spinner shows and `zodResolver` errors still display via `FieldError`
- Given `ExportModal` `isOpen=true`, when closing via `onOpenChange(false)`, then dialog closes and focus trap releases
- Given canvas `/editor` untouched, when dragging blocks, then `FlowCanvas` still renders with `@xyflow/react`, handles ≥22px, no regression
- Given `npm test`, when running, then 53 tests still pass (or updated snapshots)
- Given `npm run lint -- --max-warnings 0`, when linting, then 0 errors

## Spec Change Log

## Design Notes

Astryx graduated customization: `use as-is` → `theme tokens (CSS vars)` → `className` (Tailwind) → `own CSS` → `swizzle` eject. Prefer import CSS path first, swizzle only if needed. Button: `label*` required, `variant`/`size`/`isLoading`/`clickAction` per `xds_get("Button")`. Dialog: native `<dialog>` with `isOpen*`/`onOpenChange*` per XDS. Keep segment-driven `BlockSegments` logic outside Astryx.

## Verification

**Commands:**
- `npm install` -- expected: no peer errors (React 19 + Astryx)
- `npm run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, no CSS layer errors
- `npm test` -- expected: 53 passed (update snapshots if Card/Dialog snapshots changed)
- `npm run lint -- --max-warnings 0` -- expected: 0 errors
- `uv run ruff check .` -- expected: pass (backend untouched)
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/`, `/login`, `/editor`, verify Astryx components render and Tailwind overrides work
- Open `ExportModal`, verify Dialog focus trap and close
- Check landing buttons `variant`/`size` match design

## Suggested Review Order

**Foundation — CSS layer + deps**

- Preset CSS import + layer order (astrux + tailwind) — controls override winning
  [`main.tsx:11`](../../frontend/src/main.tsx#L11)

- Tailwind @layer ordering for utilities last
  [`index.css:1`](../../frontend/src/index.css#L1)

- Package adds @astryxdesign/core with React 19 peer
  [`package.json:14`](../../frontend/package.json#L14)

**Core UI — Dialog/Dropdown/Card/Field**

- Dialog wrapper Astryx isOpen/onOpenChange + title slots
  [`dialog.tsx:1`](../../frontend/src/components/ui/dialog.tsx#L1)

- DropdownMenu data-driven Astryx items + destructive variant
  [`dropdown-menu.tsx:1`](../../frontend/src/components/ui/dropdown-menu.tsx#L1)

- Card padding mapping size→padding + ClickableCard re-export
  [`card.tsx:1`](../../frontend/src/components/ui/card.tsx#L1)

- Field delegating to Astryx Field with FormLayout
  [`field.tsx:1`](../../frontend/src/components/ui/field.tsx#L1)

**Landing + auth**

- SiteLayout Stack vertical + HomeNav HStack buttons
  [`SiteLayout.tsx:1`](../../frontend/src/components/landing/SiteLayout.tsx#L1)

- HeroSection Button primary/secondary HStack
  [`HeroSection.tsx:1`](../../frontend/src/components/landing/HeroSection.tsx#L1)

- Login/Register Card+FormLayout Button isLoading
  [`LoginPage.tsx:1`](../../frontend/src/pages/LoginPage.tsx#L1)

**Projects + editor**

- ProjectsPage Card grid + Button actions
  [`ProjectsPage.tsx:1`](../../frontend/src/pages/ProjectsPage.tsx#L1)

- EditorHeader DropdownMenu items (Import/Export/Projects/Clear/Logout)
  [`EditorHeader.tsx:156`](../../frontend/src/components/editor/EditorHeader.tsx#L156)

- BlockSegments kept segment logic, container wrapping intent
  [`BlockSegments.tsx:9`](../../frontend/src/components/blocks/BlockSegments.tsx#L9)
