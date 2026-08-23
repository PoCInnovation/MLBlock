- source_spec: `_bmad-output/implementation-artifacts/spec-migrate-tanstack-router-catalog-cache.md`
  summary: Add header assertions for GET /api/catalog ETag/Cache-Control/304
  evidence: Review found catalog now returns Cache-Control+ETag+304 but existing tests assert only status 200 and JSON shape — header contract would regress undetected.
- source_spec: `_bmad-output/implementation-artifacts/spec-migrate-tanstack-router-catalog-cache.md`
  summary: Add route tests for TanStack beforeLoad auth redirect to /login
  evidence: Editor/projets beforeLoad guards replaced RequireAuth but no vitest mounts RouterProvider at /editor with user null to assert redirect.
- source_spec: `_bmad-output/implementation-artifacts/spec-migrate-tanstack-router-catalog-cache.md`
  summary: Add EditorPage useBlocker unsaved-changes guard tests
  evidence: Migration from useBlocker(() => isDirty()) to TanStack useBlocker with withResolver has no test covering blocked status, dialog handlers, or beforeunload.
- source_spec: `_bmad-output/implementation-artifacts/spec-migrate-tanstack-router-catalog-cache.md`
  summary: Verify catalog staleTime Infinity revalidation strategy
  evidence: EditorPage staleTime Infinity plus backend max-age 3600 means new blocks invisible until hard refresh; no test for invalidateQueries or refetch on deploy.
- source_spec: `_bmad-output/implementation-artifacts/spec-migrate-tanstack-router-catalog-cache.md`
  summary: Remove dead editorParams.ts duplication with route validateSearch
  evidence: utils/editorParams.ts remains exported but no longer imported by EditorPage; duplicates routes/editor.tsx validateSearch — will drift.
