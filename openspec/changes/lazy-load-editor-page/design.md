## Context

See proposal.md — Why. Current state: `frontend/src/router.tsx` eagerly imports all seven pages; `createBrowserRouter` builds the full route table at startup. ReactFlow (canvas, minimap, controls) is the dominant chunk and only the editor renders it. Bundle: 1.07 MB minified single chunk.

## Goals / Non-Goals

**Goals:**
- Editor page module loads on demand, split into its own async chunk
- Non-editor routes never download the editor chunk
- Suspense fallback consistent with the existing "Chargement…" centered screen

**Non-Goals:**
- Lazy-loading landing/auth pages (small, eagerly rendered by design)
- Manual `manualChunks` vendor splitting (Vite's default async chunk is sufficient)
- Route-level data loading changes

## Decisions

**`React.lazy` only for the editor route.** `const EditorPage = lazy(() => import('./pages/EditorPage'))`. Vite emits a separate chunk automatically; reactflow imports live in that chunk's dependency graph, so landing pages stop carrying them.

**Suspense placement:** wrap the lazy element where it's rendered — a `<Suspense fallback={...}>` around the editor route element inside the route object, reusing the existing loading markup (centered `Chargement…`). Static routes stay eager, so `RequireAuth` wrapping is unaffected.

**No named-export change needed** — `EditorPage.tsx` already has a default export.

## Risks / Trade-offs

- First navigation to `/editor` pays a fetch latency; mitigated by Vite's preload hints and the small fallback.
- The `useBlocker` unsaved-changes guard and stash/restore live inside `EditorPage` — lazy loading does not touch their behavior (verified in specs).
- Deep links (`/editor?pipeline=…&view=grid`) still resolve: router matching happens on the route path, module fetch is orthogonal.
