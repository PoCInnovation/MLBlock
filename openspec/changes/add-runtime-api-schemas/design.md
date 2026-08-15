## Context

See proposal.md — Why. Current state: `frontend/src/api/client.ts` validates only `/api/catalog` (`catalogSchema`) and validation responses; every other payload is returned untyped at runtime. `frontend/src/types/catalog.ts` defines TS interfaces for all payloads; `frontend/src/schemas/api.ts` holds zod schemas.

## Goals / Non-Goals

**Goals:**
- Every API-client data fetch validates its response against a zod schema at the boundary
- Descriptive errors on contract drift, never silent corruption of UI state
- Schema and TS type stay in sync

**Non-Goals:**
- Client-side request validation (payloads the app builds itself)
- Schema for every endpoint response body — only payloads actually consumed by the UI
- Changing endpoints, field names, or server contracts

## Decisions

**Derive TS types from zod schemas where practical.** `z.infer` guarantees parity; where the existing interface has doc comments or unions zod can't express cleanly, keep the interface and add a schema with the same shape (documented parity risk).

**Strict `.parse()` at the boundary, with readable errors.** Use `safeParse`-style handling: on failure, throw an `Error` naming the endpoint and the zod issues (first few), so TanStack Query surfaces it as a query error rather than delivering bad data. Extra fields are stripped by default (zod default) — non-breaking.

**Per-fetch schema, not a monolithic response union.** Each function (`fetchCatalog`, `getPipeline`, `listPipelines`, `createPipeline`, `updatePipeline`, `getJob`, `getJobOutputs`, `listPipelineJobs`, `buildPipeline`, `generatePipelineCode`) parses its own response.

## Risks / Trade-offs

- Strict parsing can break the UI if the backend emits an undocumented field shape; mitigated by zod's default strip behavior and clear error messages that identify the endpoint.
- Type parity is by discipline where schemas are hand-written; mitigated by preferring `z.infer`.
