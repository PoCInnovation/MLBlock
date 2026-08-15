## Context

See proposal.md — Why. Current state: frontend has no test tooling or `test` script; verification is `tsc --noEmit && vite build`. The pure logic modules — `src/utils/gridLayout.ts`, `src/utils/typeCheck.ts`, `src/utils/exportImport.ts`, and `fingerprintOf`/undo-redo in `src/store/useAppStore.ts` — are deterministic and DOM-free.

## Goals / Non-Goals

**Goals:**
- `npm test` runs a unit suite (vitest) and fails on any break
- Coverage of the four riskiest pure-logic areas
- Node environment, no jsdom, no React rendering

**Non-Goals:**
- Component/integration tests (no jsdom, no testing-library)
- Coverage of API client or hooks (they need mocks/servers; separate concern)
- Coverage thresholds/gates (no config churn; YAGNI until CI exists)

## Decisions

**vitest as the only new devDependency.** Already-installed Vite 5 + `@vitejs/plugin-react` integrate without extra config; `vitest` defaults to Node environment, matching the pure-function targets.

**Test placement:** colocated `*.test.ts` next to sources (`src/utils/gridLayout.test.ts`, `src/utils/typeCheck.test.ts`, `src/utils/exportImport.test.ts`, `src/store/useAppStore.test.ts`). Default vitest include covers `src/**/*.test.ts`.

**Store tests without React:** import `useAppStore` directly, drive actions via `getState()`/`setState` and assert state transitions — Zustand works headlessly. `fingerprintOf` is a pure exported function; test it directly. Undo/redo: commit points, round-trip, 50-cap eviction, redo truncation.

**`test` script:** `"test": "vitest run"` — deterministic one-shot for local runs; watch mode available via `vitest`.

## Risks / Trade-offs

- `useAppStore.ts` imports `api/client.ts` (axios + Supabase). If that import chain breaks under vitest Node env, isolate the store test with `vi.mock('../api/client')` — plan for it in tasks.
- `fingerprintOf` relies on exact JSON shape; tests pin the semantic-field contract (grid col/row participates; x/y doesn't) so accidental shape changes fail loudly.
- Node environment needs no `environment: 'jsdom'` override; reactflow types are type-only imports, so no runtime dependency.
