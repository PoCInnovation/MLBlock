# Course Companion Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-integrate interactive learning courses into the MLBlock Editor via a collapsible side companion panel, providing step-by-step instructions and real-time DAG validation feedback alongside the canvas.

**Architecture:** A Zustand store slice manages active course selection and panel visibility. On desktop (≥1024px), `CourseCompanionPanel` docks side-by-side with `FlowCanvas` in a smooth flex container; on smaller screens, it automatically delegates to the existing unified `Drawer`. A reactive watcher compares canvas nodes and edges against course expectations in real-time, displaying tailored hints and celebrating completion.

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Router, Base UI / Shadcn, Tailwind CSS v4, Lucide React, Vitest.

**Spec:** `frontend/src/content/cours/` (9 Markdown courses with expected DAG metadata) and UI/UX Option 1 architecture.

## Global Constraints

- No regressions on the existing 130 Vitest tests and 263 Pytest backend tests.
- Zero ESLint warnings (`pnpm lint --max-warnings 0`) and clean TypeScript build (`pnpm run build`).
- Dark and light theme tokens strictly respected (`bg-card`, `text-foreground`, `border-border`, `--color-accent`, etc.).
- Keyboard accessibility: all buttons, stepper controls, and collapse triggers must be navigable with `Tab` and `Enter`/`Space`.
- High-contrast visual cues: success states (`text-success`, `bg-success/15`), warnings (`text-warning`), and neutral tips.

## Review Focus

1. Canvas updates during an active course: adding, removing, or linking blocks must immediately update the watcher hints and progress bar without lag.
2. URL deep-linking: navigating to `/editor?course=classification-simple` must automatically select the course and open the panel.
3. Mobile view (<1024px): opening the course must not squish the canvas; it must render in the existing drawer or slide-over sheet.
4. Completed exercise: when all expected blocks and connections are satisfied, a clear success banner must appear with next-step navigation.
5. Canvas pre-fill or reset: switching between courses must not silently corrupt an ongoing pipeline.

---

### Task 1: Store Slice & Enhanced Course Progress Watcher

**Files:**
- Modify: `frontend/src/utils/courseWatcher.ts`
- Create: `frontend/src/utils/courseWatcher.test.ts`
- Modify: `frontend/src/store/useAppStore.ts`

**Interfaces:**
- Produces: `evaluateCourseProgress(nodes, edges, expected): CourseEvaluation`
- State: `activeCourseSlug: string | null`, `coursePanelOpen: boolean`, `setActiveCourseSlug`, `setCoursePanelOpen`, `toggleCoursePanel`

- [ ] **Step 1: Write unit tests for course evaluation logic**

Create `frontend/src/utils/courseWatcher.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { evaluateCourseProgress } from './courseWatcher'
import type { Node, Edge } from '@xyflow/react'

describe('evaluateCourseProgress', () => {
  const expected = {
    nodes: [
      { id: 'n1', type: 'load_csv' },
      { id: 'n2', type: 'decision_tree' },
      { id: 'n3', type: 'evaluate' },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
    ],
    hints: {
      load_csv: 'Glisse Load CSV depuis Données.',
      decision_tree: 'Ajoute Decision Tree.',
      evaluate: 'Termine avec Evaluate.',
    },
  }

  it('detects missing blocks and maps hints', () => {
    const nodes: Node[] = [
      { id: 'c1', type: 'block', position: { x: 0, y: 0 }, data: { type: 'load_csv' } },
    ]
    const edges: Edge[] = []
    const result = evaluateCourseProgress(nodes, edges, expected)
    expect(result.missingTypes).toEqual(['decision_tree', 'evaluate'])
    expect(result.activeHints).toContain('Ajoute Decision Tree.')
    expect(result.isComplete).toBe(false)
    expect(result.progressPercent).toBe(33)
  })

  it('detects complete and valid pipeline', () => {
    const nodes: Node[] = [
      { id: 'c1', type: 'block', position: { x: 0, y: 0 }, data: { type: 'load_csv' } },
      { id: 'c2', type: 'block', position: { x: 0, y: 0 }, data: { type: 'decision_tree' } },
      { id: 'c3', type: 'block', position: { x: 0, y: 0 }, data: { type: 'evaluate' } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'c1', target: 'c2' },
      { id: 'e2', source: 'c2', target: 'c3' },
    ]
    const result = evaluateCourseProgress(nodes, edges, expected)
    expect(result.missingTypes).toEqual([])
    expect(result.isComplete).toBe(true)
    expect(result.progressPercent).toBe(100)
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm test src/utils/courseWatcher.test.ts`
Expected: FAIL (evaluateCourseProgress not exported)

- [ ] **Step 3: Implement `evaluateCourseProgress` in `frontend/src/utils/courseWatcher.ts`**

```typescript
import type { Node, Edge } from '@xyflow/react'

export type ExpectedCourseData = {
  nodes: { id: string; type: string }[]
  edges: { from: string; fromPort?: string; to: string; toPort?: string }[]
  hints?: Record<string, string>
}

export type CourseEvaluation = {
  missingTypes: string[]
  extraTypes: string[]
  edgeMismatch: boolean
  activeHints: string[]
  isComplete: boolean
  progressPercent: number
}

function getNodeType(n: Node): string {
  const d = n.data as { type?: string } | undefined
  return d?.type ?? ''
}

export function evaluateCourseProgress(
  actualNodes: Node[],
  actualEdges: Edge[],
  expected: ExpectedCourseData
): CourseEvaluation {
  const actualTypes = actualNodes.map(getNodeType).filter(Boolean)
  const actualTypeSet = new Set(actualTypes)
  const expectedTypes = expected.nodes.map(n => n.type)
  const expectedTypeSet = new Set(expectedTypes)

  const missingTypes = expectedTypes.filter(t => !actualTypeSet.has(t))
  const extraTypes = actualTypes.filter(t => !expectedTypeSet.has(t))

  const idToType = new Map(expected.nodes.map(n => [n.id, n.type] as const))
  let edgeMismatch = false

  for (const e of expected.edges) {
    const fromType = idToType.get(e.from)
    const toType = idToType.get(e.to)
    if (!fromType || !toType) continue

    const found = actualEdges.some(fe => {
      const sN = actualNodes.find(n => n.id === fe.source)
      const tN = actualNodes.find(n => n.id === fe.target)
      if (!sN || !tN) return false
      return getNodeType(sN) === fromType && getNodeType(tN) === toType
    })
    if (!found) {
      edgeMismatch = true
      break
    }
  }

  const activeHints: string[] = []
  if (expected.hints) {
    for (const m of missingTypes) {
      if (expected.hints[m]) activeHints.push(expected.hints[m])
    }
  }

  const satisfiedNodes = expectedTypes.length - missingTypes.length
  const totalSteps = expectedTypes.length + (expected.edges.length > 0 ? 1 : 0)
  const currentSteps = satisfiedNodes + (!edgeMismatch && expected.edges.length > 0 && missingTypes.length === 0 ? 1 : 0)
  const progressPercent = totalSteps > 0 ? Math.round((currentSteps / totalSteps) * 100) : 0
  const isComplete = missingTypes.length === 0 && !edgeMismatch

  return {
    missingTypes,
    extraTypes,
    edgeMismatch,
    activeHints,
    isComplete,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
  }
}
```

- [ ] **Step 4: Add course state slice to `frontend/src/store/useAppStore.ts`**

Add state & actions to `AppStoreState`:
```typescript
activeCourseSlug: string | null
coursePanelOpen: boolean
setActiveCourseSlug: (slug: string | null) => void
setCoursePanelOpen: (open: boolean) => void
toggleCoursePanel: () => void
```
And implementation in `createAppStore`:
```typescript
activeCourseSlug: null,
coursePanelOpen: false,
setActiveCourseSlug: (slug) => set({ activeCourseSlug: slug, coursePanelOpen: slug !== null }),
setCoursePanelOpen: (open) => set({ coursePanelOpen: open }),
toggleCoursePanel: () => set((s) => ({ coursePanelOpen: !s.coursePanelOpen })),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/utils/courseWatcher.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/courseWatcher.ts frontend/src/utils/courseWatcher.test.ts frontend/src/store/useAppStore.ts
git commit -m "feat(cours): add course progress evaluator and store state slice"
```

---

### Task 2: Companion Panel UI Component (`CourseCompanionPanel.tsx`)

**Files:**
- Create: `frontend/src/components/flow/CourseCompanionPanel.tsx`
- Test: `frontend/src/components/flow/CourseCompanionPanel.test.ts`

**Interfaces:**
- Consumes: `courses`, `getCourse` from `src/content/cours`, `evaluateCourseProgress` from `src/utils/courseWatcher`, `useAppStore`
- Produces: Collapsible side panel component displaying course catalog, step-by-step guidance, reactive validation feedback, and hints.

- [ ] **Step 1: Write component unit test verifying section navigation and course picking**

Create `frontend/src/components/flow/CourseCompanionPanel.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getCourse, courses } from '../../content/cours'

describe('CourseCompanionPanel data contract', () => {
  it('retrieves valid course sections and expected DAG data', () => {
    const course = getCourse('classification-simple')
    expect(course).toBeDefined()
    expect(course?.sections.length).toBeGreaterThan(0)
    expect(course?.expected.nodes.length).toBeGreaterThan(0)
  })

  it('lists all registered courses with difficulty', () => {
    expect(courses.length).toBe(9)
    for (const c of courses) {
      expect(['facile', 'moyen', 'difficile']).toContain(c.difficulty)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm test src/components/flow/CourseCompanionPanel.test.ts`
Expected: PASS

- [ ] **Step 3: Implement `frontend/src/components/flow/CourseCompanionPanel.tsx`**

Implement component with:
1. Header: Title, difficulty badge, course selector dropdown, and close button (`X`).
2. Catalog view (when `activeCourseSlug === null`):
   - Search input filter.
   - List of course cards with title, description, difficulty chip, and « Commencer » button.
3. Active course view:
   - Section stepper (`Étape X sur Y` with « Précédent » / « Suivant »).
   - Render section body cleanly with formatted paragraphs, code snippets, and callouts.
   - **Reactive Feedback Card**:
     - Progress bar (`Progress` value={evaluation.progressPercent}).
     - If `isComplete`: Green celebration banner with « Objectif atteint ! Bravo 🎉 ».
     - If `activeHints.length > 0`: Warning cards with specific hints for missing blocks.
     - If `edgeMismatch`: Connection guidance chip.
4. Action footer:
   - « Changer de cours » button.
   - « Pré-remplir les blocs » button (commits undo point and loads expected starter nodes).

- [ ] **Step 4: Run test and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/flow/CourseCompanionPanel.tsx frontend/src/components/flow/CourseCompanionPanel.test.ts
git commit -m "feat(flow): implement CourseCompanionPanel with reactive feedback and stepper"
```

---

### Task 3: Editor Layout & Toggle Button Integration

**Files:**
- Modify: `frontend/src/components/editor/EditorHeader.tsx`
- Modify: `frontend/src/pages/EditorPage.tsx`
- Modify: `frontend/src/components/flow/FlowCanvas.tsx`

**Interfaces:**
- Consumes: `useAppStore(s => ({ coursePanelOpen, toggleCoursePanel, activeCourseSlug }))`
- Produces: Header button with active course indicator; desktop split-screen flex layout; mobile drawer fallback.

- [ ] **Step 1: Add "Cours" button in `EditorHeader.tsx`**

In `frontend/src/components/editor/EditorHeader.tsx`:
1. Import `GraduationCap` from `lucide-react`.
2. Connect store state:
   ```tsx
   const coursePanelOpen = useAppStore(s => s.coursePanelOpen)
   const toggleCoursePanel = useAppStore(s => s.toggleCoursePanel)
   const activeCourseSlug = useAppStore(s => s.activeCourseSlug)
   ```
3. Insert a toggle button beside "Blocs" and "Détails":
   ```tsx
   <Button
     variant={coursePanelOpen ? 'default' : 'secondary'}
     size="sm"
     onClick={toggleCoursePanel}
     className="gap-1.5 font-semibold text-xs h-8"
     aria-label="Afficher ou masquer les cours guidés"
   >
     <GraduationCap className="size-4 text-primary" />
     <span>Cours</span>
     {activeCourseSlug && (
       <span className="w-2 h-2 rounded-full bg-accent-light inline-block" />
     )}
   </Button>
   ```

- [ ] **Step 2: Update `EditorPage.tsx` layout for side-by-side companion panel**

In `frontend/src/pages/EditorPage.tsx`:
1. Read URL search query param `course`:
   ```tsx
   const courseParam = (search.course as string | undefined) ?? null
   useEffect(() => {
     if (courseParam) {
       useAppStore.getState().setActiveCourseSlug(courseParam)
     }
   }, [courseParam])
   ```
2. Render `CourseCompanionPanel` alongside `FlowCanvas`:
   ```tsx
   <div className="flex-1 h-full min-h-0 self-stretch flex overflow-hidden gap-4">
     <div className="floating-panel floating-canvas flex-1 h-full min-h-0 self-stretch rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-canvas">
       <FlowCanvas />
     </div>
     {coursePanelOpen && (
       <aside className="hidden lg:flex w-88 shrink-0 h-full flex-col floating-panel bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-10 transition-all">
         <CourseCompanionPanel />
       </aside>
     )}
   </div>
   ```

- [ ] **Step 3: Wire mobile drawer fallback in `FlowCanvas.tsx`**

In `frontend/src/components/flow/FlowCanvas.tsx`:
Allow `activeSheet === 'cours'` or opening `CourseCompanionPanel` inside the mobile drawer when viewport < 1024px.

- [ ] **Step 4: Run tests, lint, and build**

Run: `pnpm test && pnpm lint && pnpm run build`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/editor/EditorHeader.tsx frontend/src/pages/EditorPage.tsx frontend/src/components/flow/FlowCanvas.tsx
git commit -m "feat(editor): integrate CourseCompanionPanel in header and responsive split layout"
```

---

### Task 4: Navigation Bridge from `/cours` to Editor

**Files:**
- Modify: `frontend/src/routes/cours.$slug.tsx`
- Modify: `frontend/src/routes/cours.tsx`

**Interfaces:**
- Produces: Direct CTA buttons on course pages to launch `/editor?course=$slug` with pre-selected course.

- [ ] **Step 1: Add "Pratiquer dans l'éditeur" CTA on `/cours/$slug`**

In `frontend/src/routes/cours.$slug.tsx`:
1. Import `Play` or `Wrench` from `lucide-react`.
2. Add a primary CTA button in the course header / sidebar:
   ```tsx
   <Link
     to="/editor"
     search={{ course: course.slug }}
     className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-colors w-full sm:w-auto"
   >
     <Play className="size-4 fill-current" />
     Pratiquer dans l'éditeur
   </Link>
   ```

- [ ] **Step 2: Add shortcut button on `/cours` card list**

In `frontend/src/routes/cours.tsx`:
Add a direct "Pratiquer" button on each course card in the catalog grid.

- [ ] **Step 3: Run tests and lint**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add frontend/src/routes/cours.$slug.tsx frontend/src/routes/cours.tsx
git commit -m "feat(cours): add deep-link CTAs to practice courses directly in editor"
```

---

### Task 5: End-to-End Verification & QA

**Files:**
- Test: All Vitest frontend tests + Pytest backend tests.

- [ ] **Step 1: Run frontend test suite**

Run: `pnpm test`
Expected: All 132+ tests pass.

- [ ] **Step 2: Run frontend linter**

Run: `pnpm lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Run frontend production build**

Run: `pnpm run build`
Expected: Bundle created with 0 errors.

- [ ] **Step 4: Run backend test suite**

Run: `uv run pytest mlblock/tests -q && uv run ruff check .` in `backend/`
Expected: 263 passed, Ruff: No issues found.

- [ ] **Step 5: Final review**

Run: `git status`
Expected: Clean working tree on `dev/chedli`.
