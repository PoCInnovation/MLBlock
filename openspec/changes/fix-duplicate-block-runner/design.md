## Context

See proposal.md — Why. Current state: `EditorPage.tsx:27` calls `useBlockRunner()` and passes `onRun/onStop/onClear` to `<EditorHeader>`, whose props type is declared but deliberately ignored (`_props`, comment "sont ignorées"); the header instantiates its own `useBlockRunner`. Result: two live hook instances with independent `jobId` state and duplicate TanStack job queries.

## Goals / Non-Goals

**Goals:**
- Exactly one `useBlockRunner` instance in the editor, owned by the header
- Remove the dead hook call, dead props, and dead import
- Zero behavior change to run/stop/clear

**Non-Goals:**
- Relocating the runner (e.g., into the store or a context provider) — out of scope, adds churn
- Changing job polling cadence or error handling

## Decisions

**Delete the EditorPage instance and the props contract.** The header already works standalone; the page's copy is unreachable dead code. Removing the call and props is the minimal diff.

- `EditorPage.tsx`: drop `const { onRun, onStop, onClear } = useBlockRunner()`, drop the `useBlockRunner` import, render `<EditorHeader />` prop-less.
- `EditorHeader.tsx`: delete `EditorHeaderProps` and the compatibility comment; change signature to `export default function EditorHeader()`.

Alternative considered: lifting the runner to a shared hook/context. Rejected — the header is the only consumer; a context adds indirection with no second consumer.

## Risks / Trade-offs

- Low risk: pure deletion of dead code; the header's instance already handles all real calls.
- Verification: `npm run build` (type check) plus manual run/stop in the editor; no behavior branch changes.
