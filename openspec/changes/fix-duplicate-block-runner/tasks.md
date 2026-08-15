## 1. Remove the duplicate runner

- [x] 1.1 `frontend/src/pages/EditorPage.tsx`: remove `const { onRun, onStop, onClear } = useBlockRunner()` and the `useBlockRunner` import
- [x] 1.2 `frontend/src/pages/EditorPage.tsx`: render `<EditorHeader />` without the `onRun`/`onStop`/`onClear` props
- [x] 1.3 `frontend/src/components/editor/EditorHeader.tsx`: delete the `EditorHeaderProps` type and the "compatibilité" comment; change the signature to `export default function EditorHeader()`

## 2. Verify

- [x] 2.1 `npm run build` passes (tsc --noEmit + vite build)
- [ ] 2.2 Manual smoke: open `/editor`, run a pipeline, verify console output and Stop/Clear behave as before
