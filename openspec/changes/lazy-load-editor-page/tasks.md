## 1. Lazy loading

- [x] 1.1 `frontend/src/router.tsx`: import `lazy`, `Suspense` from react; convert `EditorPage` to `const EditorPage = lazy(() => import('./pages/EditorPage'))`
- [x] 1.2 Wrap the editor route element in `<Suspense>` with the existing centered "Chargement…" fallback markup

## 2. Verify

- [x] 2.1 `npm run build` passes and `dist/assets/` contains a separate async chunk for the editor (reactflow not in the entry chunk)
- [ ] 2.2 Smoke: navigate from landing to `/editor` (fallback shows then editor renders); deep-link `/editor?pipeline=<uuid>&view=grid` loads the pipeline
- [ ] 2.3 Verify unsaved-changes guard still intercepts navigation and stash/restore still works
