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
- source_spec: none
  summary: Migrate non-canvas UI to Astryx (landing, auth, modals, buttons, cards, fields) after React 19
  evidence: Split from React 19 + ReactFlow 12 upgrade — Astryx requires React 19, so migration must follow upgrade; each is independently shippable as separate PR.
- source_spec: none
  summary: Redesign editor to floating, rounded, centred, animated layout per Excalidraw
  evidence: Split from React 19 upgrade — editor floating redesign (rounded 16-20px panels, centered canvas, animations) is independent of React version and Astryx migration; deferred to avoid 2000+ token mega-spec and coupling risks.
- source_spec: `_bmad-output/implementation-artifacts/spec-react19-reactflow12-upgrade.md`
  summary: Add runtime mount test for FlowCanvas with @xyflow/react
  evidence: Broad React 19 + @xyflow/react migration has no canvas render test — build passes but blank canvas would ship undetected; need jsdom mount asserting handles/edges.
- source_spec: `_bmad-output/implementation-artifacts/spec-react19-reactflow12-upgrade.md`
  summary: Add navigation test for EditorUnavailableModal TanStack redirect
  evidence: Modal changed from react-router-dom to @tanstack/react-router navigate({to:'/'}) with no test — button could no-op with green CI.
- source_spec: `_bmad-output/implementation-artifacts/spec-react19-reactflow12-upgrade.md`
  summary: Add unit tests for resolveFlowSourcePath strict guards in columns.ts
  evidence: Strict Record<string,unknown> guards for load_csv path walk are untested — autocomplete could silently fail.
- source_spec: `_bmad-output/implementation-artifacts/spec-react19-reactflow12-upgrade.md`
  summary: Add unit tests for FlowCanvas portList/edgeStyleFor guards
  evidence: Array.isArray guard for portList and edgeStyleFor color mapping have no tests — wrong edge colors would ship undetected.
