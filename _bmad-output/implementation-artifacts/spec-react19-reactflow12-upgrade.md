---
title: 'Upgrade to React 19 and ReactFlow 12'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '6084a1141ea4243d122aeea56e6f55cfa5dff06f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** MLBlock runs `react@18.3.1`/`react-dom@18.3.1` + `reactflow@11.11.4` (React 18 era). Astryx XDS requires `react>=19` and future editor redesign benefits from React 19 concurrent features. Staying on 18 blocks Astryx adoption.

**Approach:** Upgrade frontend to `react@19`/`react-dom@19` + compatible `reactflow@12` (or `@xyflow/react@12` if renamed) + aligned `@types/react`/`@types/react-dom`. Keep TanStack Router, Zustand, Vite, Tailwind intact. Verify no breaking regressions in FlowCanvas/BlockNode/FlowLink and auth flow. This unlocks Astryx migration (deferred) and floating editor (deferred).

## Boundaries & Constraints

**Always:** Preserve TanStack Router file-based routing (`routeTree.gen.ts`, `validateSearch`), keep dev dummy auth (`VITE_SUPABASE_URL` contains `dummy`), keep single Zustand store, keep `render.yaml` static, use Context7 for React 19 / ReactFlow 12 migration docs, keep backend untouched.

**Ask First:** Changing Vite major version beyond 5.x, changing Node requirement beyond 20, introducing new design system in this PR, modifying Supabase auth flow.

**Never:** Migrate to Astryx or redesign editor in this PR (deferred); downgrade ReactFlow features; introduce new package manager; change `render.yaml` runtime.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fresh clone install | `npm ci` with React 19 + ReactFlow 12 | `tsc --noEmit` and `vite build` pass, `routeTree.gen.ts` still generates | Missing peer → npm error, halt and document required Node/React version |
| Editor canvas load | Navigate `/editor` with React 19 | FlowCanvas, BlockNode, FlowLink render, drag/drop, handles ≥22px (pointer: coarse) unchanged | ReactFlow API changed → console error, fallback to error boundary |
| Auth guard | `user=null` on `/editor` with React 19 | `beforeLoad` redirect to `/login` still works, dev dummy still bypasses | `useAppStore.getState().user` race → redirect loop, handle with `isDevDummy` check |
| Palette add | Click block in FlowPalette (React 19) | `onAdd` creates node, no double-add on drag (tapGuard 8px) | Synthetic keyboard event `shouldIgnoreTap(null)` → no add, as before |
| Existing tests | `npm test` vitest + `uv run pytest` | 53 frontend tests pass, backend 105 pass | Fail → fix compat, do not skip |

</frozen-after-approval>

## Code Map

- `frontend/package.json` -- bump `react` `^18.3.1`→`^19.2.8`, `react-dom` `^18.3.1`→`^19.2.8`, `reactflow` `^11.11.4`→`@xyflow/react` or `reactflow@12`, align `@types/react` `^19.2.17` already ok, `@types/react-dom` `^19`, keep `@tanstack/react-router@1.130`, `@tanstack/react-query@5.101`, `zustand@4.5`, `axios`, `zod`
- `frontend/vite.config.ts` -- verify `tanstackRouter` + `@vitejs/plugin-react@4.3` compatible with React 19 (may need `@vitejs/plugin-react@4.4+`), no change expected
- `frontend/src/main.tsx` -- `ReactDOM.createRoot` still valid in React 19, verify `createRouter` + `RouterProvider` from TanStack still mounts
- `frontend/src/routes/__root.tsx` -- `TanStackRouterDevtools` gated `import.meta.env.DEV` must still work with React 19
- `frontend/src/pages/EditorPage.tsx` -- `useBlocker` + `useSearch`/`useNavigate` from TanStack rely on React 19, verify `blocker.status` vs `state`
- `frontend/src/components/flow/FlowCanvas.tsx` -- ReactFlow 11→12 breaking: `reactflow` import path may become `@xyflow/react`, props `nodes`/`edges`/`onNodesChange` may be renamed, check migration guide via Context7
- `frontend/src/components/flow/BlockNode.tsx` + `FlowLink.tsx` -- custom nodes/edges, verify `Handle` sizing `≥22px` via `@media (pointer: coarse)` still applies with React 19
- `frontend/tsconfig.json` -- `jsx: react-jsx` still correct for React 19, `skipLibCheck: true` helps with `@types/react` skew
- `frontend/eslint.config.js` -- `eslint-plugin-react-hooks@7` + `react-refresh@0.4` must support React 19, may need bump
- `backend/` -- read-only, ensure frontend upgrade does not touch Python

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- bump `react`/`react-dom` to `^19.2.8`, `reactflow` to `12` (or `@xyflow/react`), align `@types/react-dom`, run `npm install` -- use Context7 for React 19 and ReactFlow 12 migration docs
- [x] `frontend/vite.config.ts` -- verify TanStack Router Vite plugin + React plugin still build with React 19, adjust if needed
- [x] `frontend/src/components/flow/FlowCanvas.tsx` -- migrate `import {ReactFlow} from 'reactflow'` to `from '@xyflow/react'` if ReactFlow 12 renamed, update prop names per migration guide (e.g. `nodeTypes`/`edgeTypes`)
- [x] `frontend/src/components/flow/BlockNode.tsx` + `FlowLink.tsx` -- update `Handle` imports if path changed, verify handles ≥22px still in `@layer utilities`
- [x] `frontend/src/main.tsx` -- verify `createRoot` + `RouterProvider` mounts with React 19, no `hydrate` changes needed
- [x] `frontend/src/pages/EditorPage.tsx` + routes -- verify `useBlocker`, `useSearch`, `useNavigate` from TanStack Router work with React 19 (no API change)
- [x] `frontend/tsconfig.json` -- ensure `noEmit` passes with React 19 types, fix any `JSX` namespace errors
- [x] `frontend/eslint.config.js` -- bump `eslint-plugin-react-hooks` if needed for React 19 support

**Acceptance Criteria:**
- Given `npm ci` with React 19 + ReactFlow 12, when `npm run build` runs, then `tsc --noEmit && vite build` succeeds and `routeTree.gen.ts` generates
- Given `npm test` after upgrade, when running vitest, then 53 tests pass
- Given `npm run lint -- --max-warnings 0`, when linting, then 0 errors
- Given navigating `/editor` with React 19, when dragging blocks and edges, then FlowCanvas renders, `Disposer` (dagre) still layouts, handles ≥22px, no console React warnings
- Given `user=null` visits `/editor`, when `beforeLoad` runs, then redirect to `/login` (dev dummy still works) — same as before

## Spec Change Log

## Design Notes

React 19: `createRoot` is still correct (no `hydrateRoot` change for SPA), `forwardRef` deprecated but not used in MLBlock. ReactFlow 11→12 may rename package to `@xyflow/react` (check `npm view @xyflow/react version`); migration: `import {ReactFlow} from '@xyflow/react'` + CSS `import '@xyflow/react/dist/style.css'` replaces `reactflow/dist/style.css`. Verify via Context7.

## Verification

**Commands:**
- `npm install` -- expected: no peer dep errors (React 19 + ReactFlow 12)
- `npm run build` -- expected: `tsc --noEmit` passes, Vite 2581 modules, `routeTree.gen.ts` present
- `npm test` -- expected: 53 passed
- `npm run lint -- --max-warnings 0` -- expected: 0 errors
- `uv run ruff check .` -- expected: pass (backend untouched)
- `uv run pytest mlblock/tests -q` -- expected: 105 passed
- Manual: open `/editor`, add block, drag edge, test `Disposer`, check devtools, verify no React 19 deprecation warnings in console

**Manual checks (if no CLI):**
- Verify `package.json` shows `react@19`, `reactflow` 12 or `@xyflow/react`
- Navigate all 7 routes, ensure RequireAuth/blocker still work

## Suggested Review Order

**Dependency bump — foundation**

- React 19 + @xyflow/react 12 + types alignment (peer compat)
  [`package.json:19`](../../frontend/package.json#L19)

- Vite plugin still compatible with React 19 (no JSX transform change)
  [`vite.config.ts:4`](../../frontend/vite.config.ts#L4)

**Flow canvas migration — import rename**

- FlowCanvas import rename + CSS + portList guard hardening
  [`FlowCanvas.tsx:2`](../../frontend/src/components/flow/FlowCanvas.tsx#L2)

- BlockNode Handle/NodeProps generic update
  [`BlockNode.tsx:2`](../../frontend/src/components/flow/BlockNode.tsx#L2)

- FlowLink EdgeLabelRenderer import rename
  [`FlowLink.tsx:2`](../../frontend/src/components/flow/FlowLink.tsx#L2)

**Store/utility type imports**

- Zustand store + utils columns/blockHelpers type imports to @xyflow/react
  [`useAppStore.ts:6`](../../frontend/src/store/useAppStore.ts#L6)

- columns.ts strict path walk (Record<string,unknown> guard)
  [`columns.ts:20`](../../frontend/src/utils/columns.ts#L20)

**Periphery fix**

- EditorUnavailableModal navigate API TanStack (string → object)
  [`EditorUnavailableModal.tsx:21`](../../frontend/src/components/ui/EditorUnavailableModal.tsx#L21)

- Generated routeTree still present for tsc fresh clone
  [`routeTree.gen.ts:1`](../../frontend/src/routeTree.gen.ts#L1)
