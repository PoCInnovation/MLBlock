## Why

Frontend has zero tests; verification is only `tsc --noEmit && vite build`. The riskiest logic — grid packing (`gridLayout.ts`), dirty fingerprinting (`fingerprintOf`), undo/redo stack semantics, edge pruning — is pure, deterministic code with no coverage. Backend has ~107 tests; the canvas math has none.

## What Changes

- Add `vitest` as a devDependency and a `test` script (`vitest run`) in `frontend/package.json`.
- Add unit tests for pure logic:
  - `src/utils/gridLayout.test.ts`: `colOf`/`rowOf`/`posFor`/`snapPosition`, left→right `isEdgeValid`, `pruneInvalidEdges`, `levelsFor`/`migrateToGrid` (topological levels), `colHeight` packing.
  - `src/store/useAppStore.test.ts` (or extracted pure helper): `fingerprintOf` semantics — semantic fields only, grid col/row stable, volatile ReactFlow metadata ignored; `isDirty` transitions; undo/redo stack cap at 50 and redo truncation.
  - `src/utils/typeCheck.test.ts`: `familyOf` mirror, `classifyEdge` verdicts (compatible/convertible/incompatible), `converterFor`, reachability.
  - `src/utils/exportImport.test.ts`: `parseImportFile` validation branches (malformed JSON, missing nodes/edges, defaults).
- Node environment, no jsdom; tests target pure functions, not React rendering.
- `npm run build` stays the gate; tests run separately via `npm test`.

## Capabilities

### New Capabilities

- `frontend-unit-tests`: pure frontend logic modules (grid layout, fingerprint/dirty, type conversion, import parsing, undo/redo semantics) have automated unit tests runnable via `npm test`.

### Modified Capabilities
<!-- None. -->
