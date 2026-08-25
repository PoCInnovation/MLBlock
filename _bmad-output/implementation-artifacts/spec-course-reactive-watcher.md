---
title: 'Reactive course watcher — hidden DAG vs canvas'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'd2274d08f4fb58670fdb8eb1d9a94623a80d3015'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Right `Cours` panel is static (catalog + scrollable markdown + Précédent/Suivant) with no feedback when the user diverges from the hidden `expected` DAG. For SEO/GEO courses like `predire-valeur-csv`, the defined pipeline should stay hidden while the watcher alerts `Ce n'est pas le bon bloc/branchement` in real time.

**Approach:** Add a reactive watcher inside `CoursPanel` (right sidebar only, `Cours` mode) that subscribes to `flowNodes`/`flowEdges` (Zustand) and compares live canvas `nodes {type}` + `edges {sourceHandle,targetHandle}` against the selected course `expected` full DAG (`nodes {id,type}`, `edges {from, fromPort?, to, toPort?}`) without spoiling the solution. Show a French hint banner (respecting the bottom hints toggle) when a block type is missing, extra, or a port is mis-wired (e.g., `Split.out_train → Régression` expected vs `Split.out_test → Régression` actual).

## Boundaries & Constraints

**Always:** Watcher lives in `frontend/src/components/flow/FlowCanvas.tsx` `CoursPanel` (when `rightMode==="cours"` && `selected` course); compare `flowNodes.map(n=>n.data.type)` + `flowEdges.map(e=>({from: e.source→type, fromPort: e.sourceHandle, to: e.target→type, toPort: e.targetHandle}))` vs `course.expected`; use `theme.color` for banner (warning `warning`/`errorLight`), French labels; hints toggle at bottom `HStack` `Switch` or `Toggle` `Hints: ON/OFF` (default ON) gates banner; instant, no animation; keep left `FlowPalette` and `Inspecteur`/`Console` untouched; keep `BlockNode`/`BlockSegments` grid and `resolveColumnsForPath` pattern for edge walk.

**Ask First:** Adding `expected` strict ordering vs set matching; persisting `hintsEnabled` in `localStorage`/`useAppStore`; showing `expected` DAG preview; wiring `expected` to `codegen` validation.

**Never:** Reveal `expected` nodes/edges in UI (hidden oracle); modify `frontend/src/content/cours/*.md` format in this story (already shipped); touch `backend`/`vast`/`job_outputs` (deferred D); animate watcher (instant per previous request).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Watcher idle | `Cours` mode, no course selected (catalog) | No banner, catalog + search + `facile/moyen/difficile` still works | No watcher subscription when `selected===null` |
| Divergence block | Course `predire-valeur-csv` expects `nettoyer_donnees` at étape 2, canvas has `charger_csv → regression` (missing `nettoyer`) | Banner `Ce n’est pas le bon bloc — attendu Nettoyer données à l’étape 2` (French, `hints` map), `hints` toggle ON | `hints` off → banner hidden, no error |
| Divergence edge | Expected `Split.out_train → Régression` but canvas has `Split.out_test → Régression` | Banner `Mauvais branchement — Split doit aller vers Régression via train, pas test` (port-aware) | `fromPort`/`toPort` missing in `expected` → compare only `from→to` types |
| Extra block | Canvas has extra `kmeans` not in `expected` | Banner `Bloc inattendu — KMeans ne fait pas partie de ce cours` | Extra ignored if `hints` off |
| Build | `npm run build` | `tsc --noEmit && vite build` succeeds | Zod `expected` invalid → course still readable but watcher disabled |

</frozen-after-approval>

## Code Map

- `frontend/src/content/cours/index.ts:18` -- `ExpectedSchema` `z.object({nodes: [{id,type}], edges: [{from,fromPort?,to,toPort?}], hints: Record<string,string>})` + `CourseMeta` `slug/body/sections` + `courses`/`getCourse`/`searchCourses` -- source of `expected` DAG, hints map keyed by block `type`.
- `frontend/src/content/cours/predire-valeur-csv.md:1` -- Frontmatter `expected` 7 nodes/7 edges (charger-csv:load_csv ... evaluer:evaluate) without ports -- example to test watcher port-optional comparison.
- `frontend/src/store/useAppStore.ts:35` -- `flowNodes: Node[]` `data:{type, fields, position, segs, inputs/outputs}` + `flowEdges: Edge[]` `{source, sourceHandle, target, targetHandle}` -- watcher subscribes via `useShallow(s=>({flowNodes, flowEdges}))` same as `FlowCanvasInner`.
- `frontend/src/components/flow/FlowCanvas.tsx:565` -- `CoursPanel()` currently `useState query/difficulty/selected/idx/scrollRef` + `filtered courses` + `Markdown viewer` + `Préci/Suiv` -- insertion point for watcher `useMemo` + hints toggle `HStack` at bottom; `rightMode` already `cours|inspecteur` default `inspecteur`, `transition: none` instant.
- `frontend/src/utils/columns.ts:18` -- `resolveFlowSourcePath(nodes, edges, nodeId)` DFS walk `seen` over `edges.filter(e=>e.target===id)` -- pattern to reuse for comparing `expected` edges vs actual `flowEdges` (walk `flowEdges` set, map `source` id → `type` via `flowNodes.find`).

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/flow/FlowCanvas.tsx:565` -- inside `CoursPanel`, add `const [hintsEnabled, setHintsEnabled] = useState(true)` + `HStack` bottom `Toggle`/`Switch` `label="Indices"` `isSelected={hintsEnabled}` `onChange` (French `Hints: ON/OFF` or `Afficher les indices`) -- instant, no animation, default ON.
- [x] `frontend/src/components/flow/FlowCanvas.tsx:565` -- add watcher `const watcher = useMemo(() => { if (!course || !hintsEnabled) return null; const actualTypes = new Set(flowNodes.map(n=> (n.data as any).type)); const expectedTypes = new Set(course.expected.nodes.map(n=>n.type)); const missing = [...expectedTypes].filter(t=>!actualTypes.has(t)); const extra = [...actualTypes].filter(t=>!expectedTypes.has(t) && t); // ignore empty; const edgeMismatch = course.expected.edges.find(e=> !flowEdges.some(fe=> { const sf = flowNodes.find(n=>n.id===fe.source)?.data?.type; const tf = flowNodes.find(n=>n.id===fe.target)?.data?.type; return sf===course.expected.nodes.find(n=>n.id===e.from)?.type && tf===course.expected.nodes.find(n=>n.id===e.to)?.type && (!e.fromPort||fe.sourceHandle===e.fromPort) && (!e.toPort||fe.targetHandle===e.toPort)})); return {missing, extra, edgeMismatch}}, [course, flowNodes, flowEdges, hintsEnabled])` -- compare types set + directed edges with optional port, Without spoiling full DAG, pick first missing/extra/edgeMismatch.
- [x] `frontend/src/components/flow/FlowCanvas.tsx:565` -- render banner when `watcher` has `missing`/`extra`/`edgeMismatch`: `VStack` `Banner` or `div` `bg-warning/10 border warning text-warning` with `Text` French: `missing → Ce n’est pas le bon bloc — attendu ${hints[missing[0]]||missing[0]}`, `extra → Bloc inattendu — ${extra[0]}`, `edgeMismatch → Mauvais branchement — ${edgeMismatch.from} → ${edgeMismatch.to} via ${edgeMismatch.fromPort||'port'}`, plus `hints` map lookup for friendly name; hidden when `hintsEnabled===false` or no divergence; instant.
- [x] `frontend/src/components/flow/FlowCanvas.tsx` -- ensure `CoursPanel` subscribes to `flowNodes`/`flowEdges` via `useAppStore(useShallow(...))` (or prop drilling from `FlowCanvasInner`) so watcher is live; keep `BlockNode`/`FlowPalette` untouched; no `expected` rendering.

**Acceptance Criteria:**
- Given `Cours` `predire-valeur-csv` selected with `hints ON`, when canvas has only `charger_csv`, then banner `Ce n’est pas le bon bloc — attendu Nettoyer données` appears instantly.
- Given same course, when `Split.out_test → Régression` wired but expected `Split.out_train → Régression`, then banner `Mauvais branchement` appears with port names, French.
- Given `hints` toggle OFF, when divergence, then no banner (respect toggle).
- Given `Cours` catalog with no course selected, when on catalog, then no watcher banner, search + `facile/moyen/difficile` still works, `Prédent/Suivant` hidden.
- Given `npm run build`, when building, then `tsc --noEmit && vite build` succeeds and 53 tests pass, no watcher infinite loop (memoized).

## Spec Change Log

## Design Notes

Watcher is `Set` + `find` over `expected` (7 nodes) -- O(n*m) trivial. Port-optional comparison allows `predire-valeur-csv.md` without ports to still catch missing blocks; when `expected` has `fromPort`/`toPort`, port must match. Banner uses `course.expected.hints[blockType]` for friendly French hint, fallback to `type`. `hintsEnabled` is local `useState` for this story (persist to `localStorage` is Could for later). Keep `expected` hidden -- never render `course.expected` JSON.

## Verification

**Commands:**
- `npm --prefix frontend run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, no watcher type errors
- `npm --prefix frontend test -- --run` -- expected: 53 passed
- `uv run ruff check .` -- expected: pass
- `uv run pytest mlblock/tests -q` -- expected: 105 passed

**Manual checks (if no CLI):**
- Open `/editor` right `Cours`, select `predire-valeur-csv`, verify banner appears when `Charger CSV` only, disappears after adding `Nettoyer données` via hint, `Hints` toggle hides/shows banner instantly
- Add `Split Data` with `out_test → Régression` and verify `Mauvais branchement` with port names
- Toggle `Hints` off, verify banner hidden even with divergence; back on shows again
- Add extra `KMeans` block, verify `Bloc inattendu` banner
- Check left `FlowPalette` and `Inspecteur` still instant, no regression

## Suggested Review Order

**Entry — Reactive watcher**
- Hints toggle + useMemo watcher subscribing to flowNodes/flowEdges
  [`FlowCanvas.tsx:565`](../../frontend/src/components/flow/FlowCanvas.tsx#L565)

**Banner — French instant**
- Banner renders missing/extra/edgeMismatch via hints map
  [`FlowCanvas.tsx:620`](../../frontend/src/components/flow/FlowCanvas.tsx#L620)

**Catalog still instant**
- Right Cours catalog search + facile/moyen/difficile untouched
  [`FlowCanvas.tsx:580`](../../frontend/src/components/flow/FlowCanvas.tsx#L580)

**Peripherals**
- Build and 53 tests green
  [`FlowCanvas.tsx:1`](../../frontend/src/components/flow/FlowCanvas.tsx#L1)
