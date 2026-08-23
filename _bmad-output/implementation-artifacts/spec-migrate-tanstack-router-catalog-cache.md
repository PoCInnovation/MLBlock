---
title: 'Migrate to TanStack Router and lighten catalog endpoint'
type: 'feature'
created: '2026-08-23'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '075485cfd9419dae0c80d6ed43e83b4c8fbad606'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Frontend uses `react-router-dom@7.18` with `createBrowserRouter` and manual `URLSearchParams`/`editorParams.ts` parsing — no compile-time route/search safety, `Link`/`useParams` unchecked. Every palette open hits `GET /api/catalog` (111 blocks) with no cache, wasting FastAPI + Render free-tier cycles.

**Approach:** Replace `react-router-dom` with `@tanstack/react-router` file-based routing (`routeTree.gen.ts` via CLI/Vite plugin) for 100% inferred type-safe navigation + `validateSearch` Zod (e.g. `?pipeline=uuid`). Keep all page components and `RequireAuth` semantics. Lighten server by adding `Cache-Control`/`ETag` to `GET /api/catalog` and front `staleTime: Infinity` cache, so catalog loads once per session. Use Context7 for TanStack Router docs during implementation.

## Boundaries & Constraints

**Always:** Preserve 7 routes (`/`, `/editor`, `/projets`, `/login`, `/register`, `/how-it-works`, `/about`) and French labels; keep `RequireAuth` redirect to `/login` plus dev dummy user; keep single Zustand store `useAppStore` as source of truth; keep `render.yaml` frontend `runtime: static` + `VITE_API_BASE_URL` direct; use Context7 to fetch TanStack Router docs; keep backend execution (`generate_code`/`vast.py`/111 Python blocks) untouched.

**Ask First:** Changing `react`/`node`/`vite` major versions; introducing TanStack Start/SSR; adding new backend dependencies; modifying Supabase RLS or auth flow.

**Never:** Migrate to TanStack Start/SSR; change `render.yaml` backend service; rewrite Python blocks or `core/` engine; introduce new package manager (stay `npm` front, `uv` back).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Typed navigation to editor with pipeline | `navigate({to: "/editor", search: {pipeline: uuid}})` | URL `/editor?pipeline=<uuid>`, `useSearch({from: "/editor"})` returns `{pipeline: string|undefined}` typed | Invalid uuid → Zod `validateSearch` fallback to `{pipeline: undefined}`, no crash |
| Catalog first load | No cache, `GET /api/catalog` | 200 + `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` + `ETag`, body = catalog JSON | Network error → TanStack Query retry, `catalogError` true |
| Catalog second load within hour | Cache fresh, `staleTime: Infinity` | No network request, data from Query cache | If 304 Not Modified → use cached, no toast |
| Invalid route navigation | `Link to="/unknown"` | TypeScript compile error (route not in `routeTree`) | Runtime fallback `NotFound` route if forced |
| Auth guard | `user=null` and not dev dummy, visit `/editor` | Redirect `/login` via `beforeLoad`/`RequireAuth` | `isDevDummy` (`VITE_SUPABASE_URL` contains `dummy` + `DEV`) → allow fake user |

</frozen-after-approval>

## Code Map

- `frontend/src/router.tsx` -- delete, replace by `src/routes/__root.tsx` + 7 route files + `src/router.tsx` or `src/routeTree.gen.ts` generated; contains `RequireAuth` + `createBrowserRouter` to migrate to `createRootRoute`/`createFileRoute` + `RouterProvider`
- `frontend/src/main.tsx` -- mounts `RouterProvider` instead of `RouterProvider` from react-router-dom; injects `router` instance, adds `TanStackRouterDevtools` in dev
- `frontend/vite.config.ts` -- add `@tanstack/router-vite-plugin` (or `unplugin`) to generate `routeTree.gen.ts`; keep `@vitejs/plugin-react`
- `frontend/package.json` -- replace `react-router-dom@7.18` with `@tanstack/react-router@1.x` + `@tanstack/react-router-devtools` (dev), add `@tanstack/router-cli`/`@tanstack/router-vite-plugin`
- `frontend/src/routes/__root.tsx` -- layout route, `Outlet` + `TanStackRouterDevtools`, `beforeLoad` for auth context if needed
- `frontend/src/routes/editor.tsx` etc. -- file routes wrapping `HomePage`/`EditorPage`/`ProjectsPage`/etc., `validateSearch` for `/editor?pipeline`
- `frontend/src/api/client.ts` -- `fetchCatalog` stays, caller uses `useQuery` with `staleTime: Infinity`; interceptor `supabase.auth.getSession` unchanged
- `backend/mlblock/server/routes.py` -- `catalog_router.get("")` add `Cache-Control` + `ETag` (hash of catalog JSON), return `JSONResponse` with headers; no logic change
- `frontend/src/store/useAppStore.ts` -- unchanged, `setCatalog` called from Query cache
- `frontend/tsconfig.json` -- ensure `strict: true`, `moduleResolution: bundler` supports generated `routeTree.gen.ts`
- `backend/mlblock/server/main.py` -- verify `load_dotenv()` before imports still holds for `DATABASE_URL` (read-only)
- `frontend/src/utils/editorParams.ts` -- deprecate or adapt to `validateSearch` Zod schema, keep zod `editorParamsSchema` as reference

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- replace `react-router-dom` with `@tanstack/react-router` + devtools + vite plugin, run `npm install` -- Context7 for install docs
- [x] `frontend/vite.config.ts` -- add TanStack Router Vite plugin to generate `routeTree.gen.ts` -- `vite build` still passes
- [x] `frontend/src/routes/__root.tsx` -- create root route with `Outlet` + `TanStackRouterDevtools` + auth `beforeLoad` mirroring `RequireAuth` -- dev dummy still works
- [x] `frontend/src/routes/*.tsx` -- create file routes for `/`, `/editor`, `/projets`, `/login`, `/register`, `/how-it-works`, `/about` wrapping existing pages, `validateSearch` Zod for editor pipeline param
- [x] `frontend/src/main.tsx` -- switch to `createRouter` + `RouterProvider` from `@tanstack/react-router`, remove `createBrowserRouter` import
- [x] `frontend/src/router.tsx` -- delete or keep as re-export shim if needed, remove `react-router-dom` imports
- [x] `backend/mlblock/server/routes.py` -- add `Cache-Control`/`ETag` to `GET /api/catalog` (hash catalog JSON, `max-age=3600, stale-while-revalidate=86400`)
- [x] `frontend/src/api/client.ts` -- ensure `fetchCatalog` used with `staleTime: Infinity` (update call site in `App`/`EditorPage` where catalog fetched)
- [x] `frontend/tsconfig.json` -- verify generated `routeTree.gen.ts` included, no `noEmit` errors

**Acceptance Criteria:**
- Given `npm run build` after migration, when building frontend, then `tsc --noEmit && vite build` succeeds and `routeTree.gen.ts` is generated
- Given valid navigation `navigate({to: "/editor", search: {pipeline: uuid}})`, when clicking, then URL contains `?pipeline=<uuid>` and `useSearch` returns typed value
- Given invalid route `to="/unknown"`, when TypeScript compiles, then compile error (route not in tree)
- Given `GET /api/catalog` first call, when inspecting response headers, then `Cache-Control` contains `max-age=3600` and `ETag` present
- Given second `fetchCatalog` within hour via TanStack Query, when calling, then no network request (cache hit, `staleTime: Infinity`)
- Given unauthenticated user visits `/editor`, when `beforeLoad` runs, then redirect to `/login` (dev dummy still bypasses in `DEV` with `dummy` URL)
- Given all 7 routes, when navigating each, then correct page renders and existing Zustand `loadPipeline`/`savePipeline` still work

## Spec Change Log

## Design Notes

File-based routing: each `src/routes/*.tsx` exports `Route = createFileRoute("/editor")({ component: EditorPage, validateSearch: z.object({pipeline: z.string().uuid().optional()}) })`. Root `__root.tsx` holds `Outlet` and devtools. Keep `react-router-dom` fully removed to get TS errors on leftover imports.

Catalog cache: hash via `hashlib.md5(json.dumps(catalog, sort_keys=True).encode()).hexdigest()`, set `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`. Frontend `useQuery(['catalog'], fetchCatalog, {staleTime: Infinity})`.

## Verification

**Commands:**
- `npm run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, `routeTree.gen.ts` present
- `npm test` -- expected: `vitest run` 53 tests pass (store/utils)
- `npm run lint -- --max-warnings 0` -- expected: no errors
- `uv run ruff check .` -- expected: pass (from `backend/`)
- `uv run pytest mlblock/tests -q` -- expected: pass or skip if no DATABASE_URL
- `curl -i http://localhost:8000/api/catalog` -- expected: `Cache-Control` and `ETag` headers

**Manual checks (if no CLI):**
- Navigate `/editor?pipeline=<uuid>` and refresh, verify editor loads pipeline via `validateSearch`
- Open React Router devtools panel, verify route tree shows 7 routes

## Suggested Review Order

**Router migration — type-safe entry**

- Root route with devtools gate (DEV-only) — entry for all navigation
  [`__root.tsx:1`](../../frontend/src/routes/__root.tsx#L1)

- Vite plugin generating routeTree — build-time type generation
  [`vite.config.ts:4`](../../frontend/vite.config.ts#L4)

- Router creation with file-based tree and Register augmentation
  [`main.tsx:12`](../../frontend/src/main.tsx#L12)

**File routes + search validation**

- Editor validateSearch Zod + beforeLoad redirect (auth guard)
  [`editor.tsx:6`](../../frontend/src/routes/editor.tsx#L6)

- Projets beforeLoad redirect (second auth guard)
  [`projets.tsx:1`](../../frontend/src/routes/projets.tsx#L1)

- Index/home + login/register/how-it-works/about routes wrapping pages
  [`index.tsx:1`](../../frontend/src/routes/index.tsx#L1)

**Editor integration — search + blocker**

- EditorPage useSearch/useNavigate + blocker withResolver + staleTime Infinity
  [`EditorPage.tsx:27`](../../frontend/src/pages/EditorPage.tsx#L27)

- URL mirror effect merging search (pipeline param sync)
  [`EditorPage.tsx:118`](../../frontend/src/pages/EditorPage.tsx#L118)

**Backend cache — lighten server**

- Catalog Cache-Control + ETag md5 + weak/* + 304 Response
  [`routes.py:133`](../../backend/mlblock/server/routes.py#L133)

**Config + periphery**

- Package deps: tanstack router + devtools + plugin
  [`package.json:18`](../../frontend/package.json#L18)

- Generated routeTree (keep for fresh clone tsc)
  [`routeTree.gen.ts:1`](../../frontend/src/routeTree.gen.ts#L1)

- Router shim cleanup
  [`router.tsx:1`](../../frontend/src/router.tsx#L1)
