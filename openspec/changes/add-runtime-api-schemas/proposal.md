## Why

Only the catalog and validation payloads are zod-validated at the API boundary (`client.ts:76`). Every other response (`PipelineDetail`, `Job`, `JobOutput`, build/generate) is typed TS-only, unchecked against the wire. Backend contract drift silently surfaces as runtime errors in the UI instead of failing fast with a readable message.

## What Changes

- `frontend/src/schemas/api.ts`: add zod schemas for `PipelineDetail`, `PipelineSummary`, `PipelinePage`, `Job`, `JobOutput`, `BuildResponse`, `GenerateResponse`, `PipelineCreate` request payloads.
- `frontend/src/api/client.ts`: parse every server response through its schema (`.parse` at the boundary, descriptive error on mismatch).
- `frontend/src/types/catalog.ts`: keep TS types as the shape source of truth; schemas and types stay in sync (derive types from schemas where practical).
- No endpoint/URL changes; **BREAKING** only for consumers of malformed payloads — those now throw instead of proceeding with bad data.

## Capabilities

### New Capabilities

- `api-response-validation`: every REST response consumed by the frontend is validated against a zod schema at the fetch boundary; schema mismatch produces a descriptive error and never silently corrupts UI state.

### Modified Capabilities
<!-- None. -->
