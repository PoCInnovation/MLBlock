## Why

Bundle is 1.07 MB minified (331 kB gzip) in a single chunk. `router.tsx` eagerly imports all 7 pages, so reactflow (~the bulk) loads on the landing/login pages that never render it. Route-level lazy loading cuts initial JS for non-editor routes.

## What Changes

- `frontend/src/router.tsx`: convert `EditorPage` to `React.lazy(() => import('./pages/EditorPage'))`.
- `frontend/src/router.tsx`: wrap the lazy route element in `<Suspense>` with the existing "Chargement…" centered fallback.
- Vite emits the editor as a separate async chunk; no `manualChunks` config needed.
- Landing, auth, and static pages keep eager loading (they are small); only the editor route splits.

## Capabilities

### New Capabilities

- `route-code-splitting`: the editor route loads its module asynchronously; non-editor routes never download the editor chunk (including reactflow), verified by distinct output chunks and a Suspense fallback.

### Modified Capabilities
<!-- None. -->
