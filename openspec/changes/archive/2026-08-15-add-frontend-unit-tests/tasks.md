## 1. Tooling

- [x] 1.1 Add `vitest` as a devDependency in `frontend/package.json`
- [x] 1.2 Add `"test": "vitest run"` script to `frontend/package.json`

## 2. Tests

- [x] 2.1 `frontend/src/utils/gridLayout.test.ts`: colOf/rowOf/posFor/snapPosition; isEdgeValid left→right rule; pruneInvalidEdges; levelsFor longest-path; migrateToGrid; colHeight packing
- [x] 2.2 `frontend/src/store/useAppStore.test.ts`: fingerprintOf semantic fields (grid col/row stable, free x/y ignored, volatile metadata ignored, field/edge change detected); isDirty transitions; undo/redo round-trip, 50-cap eviction, redo truncation on new commit
- [x] 2.3 `frontend/src/utils/typeCheck.test.ts`: familyOf mirror; classifyEdge compatible/convertible/incompatible; converterFor; reachability
- [x] 2.4 `frontend/src/utils/exportImport.test.ts`: parseImportFile branches — invalid JSON, missing nodes/edges, defaults (name fallback, port defaults)

## 3. Verify

- [x] 3.1 `npm test` runs the suite green in Node env (mock `../api/client` in the store test if the axios/Supabase import chain breaks)
- [x] 3.2 `npm run build` still passes
