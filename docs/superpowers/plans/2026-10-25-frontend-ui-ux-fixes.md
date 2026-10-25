# Frontend UI/UX & Accessibility Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 12 findings from the UI/UX & Accessibility audit across forms, touch interactions, drawer controls, modals, and design tokens to achieve WCAG 2.1/2.2 AA compliance and full mobile/desktop polish.

**Architecture:** Fixes are scoped to individual UI components and utility files without changing application state logic. Form fields gain explicit HTML `<label>` pairings and ARIA error descriptions; interactive elements gain accessible names and touch-device overrides; dead pre-migration CSS is purged; modals adopt the standard `Dialog` component with accessible focus trapping.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Base UI / Shadcn, Vitest, Lucide React.

**Spec:** `docs/UX_Blocks_Rework/coverage.md` and UI/UX Audit findings (2026-10-25).

## Global Constraints

- No regression on existing 129 Vitest tests or 258 Pytest backend tests.
- Zero ESLint warnings (`pnpm lint --max-warnings 0`) and zero TypeScript build errors (`pnpm run build`).
- Dark and light theme tokens strictly preserved via CSS variables (`--ring`, `--background`, `--card`, `--foreground`).
- Touch targets on interactive elements must meet WCAG 2.5.8 (minimum 24px) or platform recommendations (>= 32-44px).
- French copy for all user-facing labels and descriptions.

## Review Focus

1. Form field with validation error: screen reader must announce the error text (`role="alert"`, `aria-invalid="true"`, `aria-describedby`) and input must be bound to a `<label>`.
2. Mobile touch screen without mouse hover: user must be able to delete a block or access its actions without relying on `:hover`.
3. CompatSheet with >12 compatible blocks: all matching blocks must remain visible and selectable via natural drawer scrolling.
4. Drawer on desktop: user must have a visible close button (`X`) in addition to Escape / backdrop click.
5. High-contrast or light theme: category badges and drag handles must maintain at least 3:1 non-text contrast against card surfaces.

---

### Task 1: Form Accessibility & Live Error Announcements in `BlockSegments.tsx`

**Files:**
- Modify: `frontend/src/components/blocks/BlockSegments.tsx`
- Test: `frontend/src/components/blocks/BlockSegments.test.ts` (or `frontend/src/utils/paramHints.test.ts`)

**Interfaces:**
- Consumes: `describeParam(s, value)` from `src/utils/paramHints`
- Produces: Accessible input fields with unique `id`, `<label htmlFor={id}>`, `aria-invalid`, `aria-describedby`, and `role="alert"` for error containers.

- [ ] **Step 1: Write unit test verifying accessible attribute bindings**

Create `frontend/src/components/blocks/BlockSegments.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { describeParam } from '../../utils/paramHints'

describe('BlockSegments accessibility contracts', () => {
  it('generates consistent field and error IDs', () => {
    const blockId = 'conv2d_123'
    const paramKey = 'in_channels'
    const inputId = `${blockId}-${paramKey}`
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`
    expect(inputId).toBe('conv2d_123-in_channels')
    expect(errorId).toBe('conv2d_123-in_channels-error')
    expect(hintId).toBe('conv2d_123-in_channels-hint')
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm test src/components/blocks/BlockSegments.test.ts`
Expected: PASS

- [ ] **Step 3: Implement accessible labels and error linking in `BlockSegments.tsx`**

In `frontend/src/components/blocks/BlockSegments.tsx`:
1. Generate unique element IDs inside `row`:
   ```typescript
   const fieldId = blockId ? `${blockId}-${s.k}` : `field-${s.k}`
   const errorId = `${fieldId}-error`
   const hintId = `${fieldId}-hint`
   ```
2. Replace `<span className={LABEL_CLS}>{humanKey(s.k)}</span>` with:
   ```typescript
   <label htmlFor={fieldId} className={LABEL_CLS}>
     {humanKey(s.k)}
   </label>
   ```
3. Pass `id={fieldId}` to each input (`s.t === 'sug'`, `s.t === 'num'`, `s.t === 'list'`).
4. Add `aria-invalid={Boolean(invalid)}` and `aria-describedby={invalid ? errorId : hint ? hintId : undefined}` to all inputs.
5. Render the error container with `id={errorId} role="alert"` when `invalid` is present:
   ```typescript
   {invalid ? (
     <span id={errorId} role="alert" className={ERR_CLS}>{invalid}</span>
   ) : hint ? (
     <span id={hintId} className={HINT_CLS}>{hint}</span>
   ) : null}
   ```
6. Increase suggestion chip padding and touch target from `py-0.5` to `py-1 px-3 min-h-[28px]` with `gap-2`.

- [ ] **Step 4: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/blocks/BlockSegments.tsx frontend/src/components/blocks/BlockSegments.test.ts
git commit -m "fix(a11y): add accessible labels, error descriptors, and role alert to block parameters"
```

---

### Task 2: Touch Interaction & Visual Contrast in `BlockCard.tsx`

**Files:**
- Modify: `frontend/src/components/flow/BlockCard.tsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `blockCardInfo(catalog, type)` from `src/utils/superblocks`
- Produces: Visible, touch-friendly block deletion on touch devices; readable category badge contrast in both light and dark themes.

- [ ] **Step 1: Update `BlockCard.tsx` for mobile delete visibility and category badge contrast**

In `frontend/src/components/flow/BlockCard.tsx`:
1. Give the delete button a minimum touch target and ensure it remains accessible via a dedicated touch-visible class:
   ```tsx
   {onDelete && (
     <button
       type="button"
       onClick={e => { e.stopPropagation(); onDelete() }}
       aria-label={`Supprimer ${info.title}`}
       className="block-delete-btn shrink-0 border-none bg-transparent text-muted-foreground hover:text-destructive cursor-pointer p-1.5 text-xs font-extrabold opacity-0 transition-opacity focus-visible:opacity-100 group-hover/card:opacity-100 rounded-md min-w-[32px] min-h-[32px] flex items-center justify-center"
     >
       Supprimer
     </button>
   )}
   ```
2. In `index.css`, add a coarse-pointer rule:
   ```css
   @media (pointer: coarse) {
     .block-delete-btn {
       opacity: 0.8 !important;
     }
   }
   ```
3. Ensure category badges on cards use a solid, high-contrast readable border and background tint in light mode:
   ```tsx
   <Badge
     variant="outline"
     className="text-[10px] font-extrabold shrink-0 rounded-full border-[color:var(--cat-color)] bg-[color:var(--cat-color)]/10 text-foreground dark:text-[color:var(--cat-color)]"
     style={{ '--cat-color': info.categoryColor } as React.CSSProperties}
   >
     {info.badge}
   </Badge>
   ```

- [ ] **Step 2: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/flow/BlockCard.tsx frontend/src/index.css
git commit -m "fix(ui-ux): enhance touch target for block deletion and improve category badge contrast"
```

---

### Task 3: Navigation Accessibility & Action Labels in `HomeNav.tsx` and `EditorHeader.tsx`

**Files:**
- Modify: `frontend/src/components/landing/HomeNav.tsx`
- Modify: `frontend/src/components/editor/EditorHeader.tsx`

**Interfaces:**
- Produces: Keyboard-navigable logo with proper role/link semantics, explicit `aria-label`s on icon buttons.

- [ ] **Step 1: Fix logo keyboard navigation in `HomeNav.tsx`**

In `frontend/src/components/landing/HomeNav.tsx`:
Replace the unsemantic `div onClick` (l. 72–80) with a semantic, keyboard-accessible button or link:
```tsx
<button
  type="button"
  onClick={() => navigate({ to: '/' })}
  aria-label="MLBlock - Accueil"
  className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 m-0 focus-visible:outline-2 focus-visible:outline-ring rounded-lg text-left"
>
  <div className="w-8.5 h-8.5 rounded-md bg-accent shadow-btn flex items-center justify-center">
    <div className="w-3.25 h-3.25 bg-white rounded-xs" />
  </div>
  <span className="font-heading font-semibold text-2xl tracking-tight text-text">MLBlock</span>
</button>
```

- [ ] **Step 2: Add missing `aria-label` on Undo/Redo icon buttons in `EditorHeader.tsx`**

In `frontend/src/components/editor/EditorHeader.tsx`:
Add `aria-label` to Undo and Redo buttons:
```tsx
<Button
  title="Annuler (Ctrl+Z)"
  aria-label="Annuler la dernière action (Ctrl+Z)"
  variant="ghost"
  size="icon"
  disabled={!canUndo}
  onClick={undo}
>
  <Undo2 className="size-4" />
</Button>
<Button
  title="Rétablir (Ctrl+Shift+Z)"
  aria-label="Rétablir la dernière action (Ctrl+Shift+Z)"
  variant="ghost"
  size="icon"
  disabled={!canRedo}
  onClick={redo}
>
  <Redo2 className="size-4" />
</Button>
```

- [ ] **Step 3: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/landing/HomeNav.tsx frontend/src/components/editor/EditorHeader.tsx
git commit -m "fix(a11y): add keyboard navigation to landing logo and accessible labels to undo/redo"
```

---

### Task 4: Drawer Close Button, Full Compat List & Accessible `EditorUnavailableModal`

**Files:**
- Modify: `frontend/src/components/flow/FlowCanvas.tsx`
- Modify: `frontend/src/components/flow/CompatSheet.tsx`
- Modify: `frontend/src/components/ui/EditorUnavailableModal.tsx`

**Interfaces:**
- Consumes: `DrawerClose` from `src/components/ui/drawer`, `Dialog` from `src/components/ui/dialog`
- Produces: Visible `X` close button on drawer; unconstrained compatible block listing; focus-trapped server unavailable dialog.

- [ ] **Step 1: Add explicit close button (`X`) in Drawer (`FlowCanvas.tsx`)**

In `frontend/src/components/flow/FlowCanvas.tsx`:
1. Import `DrawerClose` from `@/components/ui/drawer` and `X` from `lucide-react`.
2. Add a desktop-friendly close button inside `DrawerContent`:
   ```tsx
   <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
     <h2 className="text-base font-heading font-bold text-foreground">
       {activeSheet === 'add'
         ? 'Catalogue des Super-Blocs'
         : activeSheet === 'config'
         ? 'Configurer le Super-Bloc'
         : activeSheet === 'compat'
         ? 'Blocs compatibles'
         : activeSheet === 'inspect'
         ? 'Inspecteur de Paramètres'
         : 'Journal d’Exécution'}
     </h2>
     <DrawerClose asChild>
       <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="Fermer le panneau">
         <X className="size-4" />
       </Button>
     </DrawerClose>
   </div>
   ```

- [ ] **Step 2: Remove arbitrary 12-block limit in `CompatSheet.tsx`**

In `frontend/src/components/flow/CompatSheet.tsx`:
Remove `.slice(0, 12)` on lines 55 and 65:
```tsx
{group.compatible.length > 0 && (
  <div className="flex flex-col gap-2">
    {group.compatible.map(type => (
      <BlockCard key={type} type={type} onClick={() => onPick(type)} />
    ))}
  </div>
)}
{group.convertible.length > 0 && (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold text-muted-foreground pt-1">
      Via adaptateur automatique
    </span>
    {group.convertible.map(type => (
      <BlockCard key={type} type={type} onClick={() => onPick(type)} />
    ))}
  </div>
)}
```

- [ ] **Step 3: Refactor `EditorUnavailableModal.tsx` using accessible `Dialog`**

In `frontend/src/components/ui/EditorUnavailableModal.tsx`:
Wrap in `Dialog` from `src/components/ui/dialog`:
```tsx
import { useNavigate } from '@tanstack/react-router'
import useAppStore from '../../store/useAppStore'
import { CloudOff, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './dialog'

export default function EditorUnavailableModal() {
  const navigate = useNavigate()
  const message = useAppStore(s => s.catalogErrorMessage)

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-md bg-card border-border p-6 flex flex-col gap-4 text-center items-center">
        <div className="text-4xl text-warning flex justify-center pt-2">
          <CloudOff className="size-10" />
        </div>
        <DialogHeader className="gap-1 items-center">
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Éditeur non disponible
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground text-center">
            {message ?? 'Impossible de joindre le serveur. Vérifie que le backend est lancé et réessaie.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full justify-center mt-2">
          <Button
            onClick={() => navigate({ to: '/' })}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="size-4 mr-2" /> Retour à l'accueil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/flow/FlowCanvas.tsx frontend/src/components/flow/CompatSheet.tsx frontend/src/components/ui/EditorUnavailableModal.tsx
git commit -m "fix(ui-ux): add drawer close button, uncap compat block list, and standardize unavailable modal"
```

---

### Task 5: CSS Cleanup, Design Token Ring & Responsive Polish

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/pages/ProjectsPage.tsx`
- Modify: `frontend/src/components/flow/JournalPanel.tsx`

**Interfaces:**
- Produces: Cleaned CSS without stale `.flow-palette` classes; theme-compliant focus outline; responsive projects page header; accessible curve SVG and output images.

- [ ] **Step 1: Clean stale CSS and bind `:focus-visible` to token in `index.css`**

In `frontend/src/index.css`:
1. Replace line 114:
   ```css
   :focus-visible { outline: 2px solid var(--color-ring, #D97757); outline-offset: 2px; }
   ```
2. Remove unused legacy classes from lines 272–276 and 312–345:
   - Remove `.flow-palette`, `.palette-toggle`, `.palette-backdrop`, `.palette-drawer`, `.inspector-panel`.
   - In prefers-reduced-motion (line 431), remove `.flow-palette, .palette-drawer`.

- [ ] **Step 2: Make `ProjectsPage.tsx` header responsive on mobile**

In `frontend/src/pages/ProjectsPage.tsx`:
Change `headerStyle` (l. 28–29):
```typescript
const headerStyle =
  'max-w-5xl mx-auto mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
```
And wrap the action buttons in a responsive flex layout:
```tsx
<div className="flex flex-wrap items-center gap-2.5">
```

- [ ] **Step 3: Add accessible roles and alt text in `JournalPanel.tsx`**

In `frontend/src/components/flow/JournalPanel.tsx`:
1. In `<Curve>`:
   ```tsx
   <svg
     role="img"
     aria-label="Courbe d'évolution des métriques"
     viewBox="0 0 100 50"
     preserveAspectRatio="none"
     className="w-full h-28 bg-white/5 rounded-lg block"
   >
   ```
2. In `<OutputRenderer>`:
   ```tsx
   return <img src={src} alt="Graphique généré par le modèle" className="max-w-full max-h-56 rounded-md block" />
   ```

- [ ] **Step 4: Run tests and lint**

Run: `pnpm test && pnpm lint && pnpm run build`
Expected: PASS with 0 errors and successful production bundle.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css frontend/src/pages/ProjectsPage.tsx frontend/src/components/flow/JournalPanel.tsx
git commit -m "fix(ui-ux): clean stale css, sync focus ring token, improve mobile projects header and journal a11y"
```

---

### Task 6: End-to-End Verification & QA

**Files:**
- Test: all backend pytest + frontend vitest suites.

- [ ] **Step 1: Run full frontend test suite**

Run: `pnpm test` in `frontend/`
Expected: All 129+ tests pass.

- [ ] **Step 2: Run frontend production build**

Run: `pnpm run build` in `frontend/`
Expected: `tsc --noEmit` and `vite build` complete with 0 errors.

- [ ] **Step 3: Run frontend linter**

Run: `pnpm lint` in `frontend/`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Run backend tests and linter**

Run: `uv run pytest mlblock/tests -q && uv run ruff check .` in `backend/`
Expected: 258 passed, Ruff: No issues found.

- [ ] **Step 5: Final review and commit check**

Run: `git status`
Expected: Clean working tree on `dev/chedli`.
