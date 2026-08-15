## Why

`EditorPage` instantiates `useBlockRunner()` solely to pass `onRun`/`onStop`/`onClear` to `<EditorHeader>`, which ignores those props (declared `_props`, "sont ignorées") and instantiates its own `useBlockRunner`. Two hook instances live at once: two `jobId` states, two TanStack job queries, duplicated 3s polling. The EditorPage instance is dead weight — a second bug factory.

## What Changes

- `frontend/src/pages/EditorPage.tsx`: remove the `useBlockRunner()` call, the `onRun/onStop/onClear` destructure, and the unused import.
- `frontend/src/pages/EditorPage.tsx`: render `<EditorHeader />` without props.
- `frontend/src/components/editor/EditorHeader.tsx`: drop the `EditorHeaderProps` type (and its "compatibilité" comment); the hook instance inside the header becomes the single run-controls owner.
- No behavior change: run/stop/clear still work exactly as before, driven solely by the header's instance.

## Capabilities

### New Capabilities

- `run-controls`: the editor's run/stop/clear controls are owned by exactly one `useBlockRunner` instance (the editor header); no other component instantiates the runner or receives run-control props.

### Modified Capabilities
<!-- None. -->
