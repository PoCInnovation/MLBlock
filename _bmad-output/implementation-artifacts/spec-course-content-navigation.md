---
title: 'Course content & navigation — markdown with full DAG'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 1
baseline_commit: '1cf25a36bec40caa8e0f90afdbe55c5fb9839f65'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Right sidebar `Cours` is a stub (`Aucun cours sélectionné` + `Catalogue à venir`) with no content, no navigation, no SEO/GEO. Courses must be authorable as markdown in `frontend/src/content/cours/` and navigable via catalog + in-panel reading.

**Approach:** Define course markdown format with frontmatter (`title`, `difficulty` `facile|moyen|difficile`, `description`, `seo`, full DAG `expected: {nodes, edges, hints}`) and `##` sections. In `Cours` panel, render searchable catalog (search + `facile/moyen/difficile` filter) and, when a course is selected, a scrollable markdown viewer with `Précédent/Suivant` jumping `##` anchors. Expose the same catalog on `/cours` landing for SEO/GEO. Left sidebar untouched, right toggle stays manual instant French.

## Boundaries & Constraints

**Always:** Storage `frontend/src/content/cours/*.md` one file per course, frontmatter validated via Zod; full DAG `expected.nodes[] {id,type}` + `expected.edges[] {from, fromPort?, to, toPort?}` plus `hints` map; markdown body uses `##` as sections with `id` anchors; `Cours` panel scrollable; `Précédent/Suivant` jumps `##`; catalog search (fuzzy on `title`/`description`) + `facile/moyen/difficile` filter; landing `/cours` mirrors right catalog for SEO; French labels; instant, no animation.

**Ask First:** Using MDX instead of markdown + frontmatter; adding DB/CMS storage instead of file-based; changing difficulty values beyond `facile|moyen|difficile`.

**Never:** Touch left `FlowPalette` or per-block GPU/DB/ watcher (deferred C/D); add backend DB table for courses (file-based only in this story); animate catalog (instant per previous request).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Catalog render | Right `Cours` with 3 courses, filter `facile` | Lists only `facile` courses, search filters live, empty → `Aucun cours trouvé` | No files → empty state `Aucun cours disponible` |
| Course open | Click `predire-valeur-csv` | Scrollable markdown renders `##` sections with anchors, `Précédent/Suivant` enabled, frontmatter `expected` not rendered | Missing file → `Cours introuvable` + back to catalog |
| Navigation | In course at `## Étape 2`, click `Suivant` | Scrolls to `## Étape 3` via `id`, `Précédent` back, first/last disabled | No `##` → hide nav, show full markdown |
| Landing SEO | GET `/cours` | Same catalog grid as right panel, links `href="/cours/$slug"` crawlable | No route → 404, no SEO |
| Frontmatter | Invalid `difficulty` or missing `expected` | Zod validation fails, course excluded from catalog, console warn | Invalid DAG → course still readable but watcher not usable (C deferred) |

</frozen-after-approval>

## Code Map

- `frontend/src/content/cours/` -- MISSING directory, expected per intent `frontend/src/content/cours/*.md` one file per course, markdown source of truth -- to be created with `predire-valeur-csv.md` (7-step CSV pipeline) and `cours/index.ts` loader.
- `frontend/src/routes/cours.tsx` + `frontend/src/routes/cours.$slug.tsx` -- MISSING TanStack file routes for `/cours` catalog and `/cours/$slug` detail (or embedded right-panel only) -- to be created; existing router is `src/routes/__root.tsx` + `routeTree.gen.ts` with routes `/`, `/about`, `/editor`, `/how-it-works`, `/login`, `/projets`, `/register`.
- `frontend/src/components/flow/FlowCanvas.tsx:565` -- `CoursPlaceholder` `VStack` `Aucun cours sélectionné` + `Catalogue à venir` -- to be replaced with catalog + markdown viewer; `rightMode` state already `cours|inspecteur` default `inspecteur`, `ToggleButtonGroup` already in header, badge dot already wired.
- `frontend/src/components/flow/FlowPalette.tsx:211` -- Left palette `Grid columns={2}` ToggleButtonGroup reference for right catalog filter pattern (reuse `ToggleButtonGroup` + `Grid` + `TextInput`).
- `_bmad-output/brainstorming/brainstorm-right-sidebar-course-inspector-2026-08-24/brainstorm-intent.md:25` -- Canonical format: frontmatter `difficulty`, `expected: {nodes, edges, hints, seo}`, markdown `##` sections, `Prédent/Suivant`.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/content/cours/predire-valeur-csv.md` -- create reference course with frontmatter `id: predire-valeur-csv`, `title`, `difficulty: facile`, `description`, `seo`, `expected: {nodes: [{id,type}], edges: [{from, fromPort?, to, toPort?}], hints: {blockType: string}}` (full DAG 7 nodes/7 edges for CSV prediction) and body 7× `## Étape N` (Charger CSV → Démarrer) as defined in brainstorm.
- [x] `frontend/src/content/cours/index.ts` -- create loader using `import.meta.glob('./*.md', {query: '?raw', import: 'default'})` + `gray-matter` or frontmatter `---` parser + Zod `CourseMeta` (`difficulty` enum `facile|moyen|difficile`, `expected.nodes` `z.array`, `edges` optional port) -- exports `courses: CourseMeta[]` + `getCourse(slug)` + `searchCourses(q, difficulty)`; build-time, no backend.
- [x] `frontend/src/routes/cours.tsx` -- create TanStack file route `/cours` (`createFileRoute('/cours')`) rendering catalog `Grid` (reuse `Card`/`TextInput`/`ToggleButtonGroup`) with search `TextInput placeholder="Rechercher un cours…"` + `ToggleButtonGroup type="single" value={difficulty} size="sm"` `Tous|Facile|Moyen|Difficile` filtering `courses`, links to `/cours/$slug` and `onSelect` callback to right panel via `?cours=slug` or `useAppStore` selectedCourse.
- [x] `frontend/src/routes/cours.$slug.tsx` -- create detail route (or reuse landing) rendering markdown via `react-markdown` or `Markdown` Astryx (`xds_get` for Markdown) with `id` anchors from `##`, plus `Précédent/Suivant` `Button` `variant="ghost"` jumping `##` via `scrollIntoView` or hash `#$slug`; SEO `head` via `seo`.
- [x] `frontend/src/components/flow/FlowCanvas.tsx:565` -- replace `CoursPlaceholder` with right-panel viewer: when `rightMode==="cours"` and no `selectedCourse` → catalog `VStack` `TextInput` search + `ToggleButtonGroup` `facile/moyen/difficile` `Grid` `ClickableCard` list; when `selectedCourse` → scrollable `VStack` `Markdown` + sticky `HStack` `Button Précédent/Suivant` disabled at ends, `Divider` between `##` sections, `id` anchors; instant, French, scrollable as panel may be smaller than content.

**Acceptance Criteria:**
- Given `frontend/src/content/cours/predire-valeur-csv.md` exists, when building, then frontmatter parses, course appears in both `/cours` and right `Cours` catalog under `facile`, search finds it.
- Given right `Cours` with `facile` filter, when searching `CSV`, then only matching courses show, empty → `Aucun cours trouvé`.
- Given a course open, when clicking `Suivant` at `## Étape 2`, then viewport scrolls to `## Étape 3` `id`, `Précédent` back, first/last disabled.
- Given `/cours` landing, when crawling, then `href="/cours/predire-valeur-csv"` is present for SEO/GEO.
- Given `npm run build`, when building, then `tsc --noEmit && vite build` succeeds, no `import.meta.glob` errors, 53 tests pass.

## Spec Change Log

## Design Notes

Frontmatter Zod ensures `expected` is valid DAG for future watcher (C) but not rendered in this story. `##` → `id` via `slugify` (`prediction-valeur-csv-etape-2`); `Prédent/Suivant` uses `scrollIntoView({behavior: 'auto'})` instant per no-animation rule. Catalog reuse: right panel and `/cours` share `courses` loader and `ToggleButtonGroup` + `Grid` pattern from `FlowPalette`. Keep `frontend/src/content/cours` file-based only (no DB) for this story.

## Verification

**Commands:**
- `npm --prefix frontend run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, markdown `?raw` imports work
- `npm --prefix frontend test -- --run` -- expected: 53 passed
- `uv run ruff check .` -- expected: pass
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/cours`, verify catalog shows `predire-valeur-csv` under `facile`, search filters, difficulty toggle works, link to detail
- Open `/editor` right `Cours`, verify same catalog + search + `facile/moyen/difficile`, click course → markdown scrollable, `Précédent/Suivant` jumps `##`, correct French labels, instant
- Click landing course card → navigates to `/cours/$slug` or injects into right panel

## Suggested Review Order

**Entry — Course frontmatter & markdown**
- Full DAG expected nodes/edges/hints with Zod validation
  [`predire-valeur-csv.md:1`](../../frontend/src/content/cours/predire-valeur-csv.md#L1)

**Loader — build-time catalog**
- import.meta.glob + YAML parser + slugify sections
  [`index.ts:1`](../../frontend/src/content/cours/index.ts#L1)

**Routing — SEO/GEO landing**
- TanStack file routes cours and cours.$slug with Markdown
  [`cours.tsx:1`](../../frontend/src/routes/cours.tsx#L1)

**Right panel — instant toggle integration**
- CoursPanel search + Toggle facile/moyen/difficile + Précédent/Suivant
  [`FlowCanvas.tsx:565`](../../frontend/src/components/flow/FlowCanvas.tsx#L565)

**Peripherals**
- Build and 53 tests still green
  [`FlowCanvas.tsx:1`](../../frontend/src/components/flow/FlowCanvas.tsx#L1)
