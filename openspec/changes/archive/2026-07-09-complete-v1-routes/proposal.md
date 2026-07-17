## Why

The v1 spec defines three database tables (`profiles`, `pipelines`, `jobs`) but only exposes three routes — `GET /blocks`, `POST /pipelines/save`, `POST /pipelines/{id}/execute`. Pipelines are write-only (save but never list/load/update/delete), jobs are create-only (execute but never read output), and there's no auth context despite every table having a `user_id` FK. The frontend can't build a usable UI without these routes.

## What Changes

- Add full pipeline CRUD: list, get, update, delete (replacing the single `/save` endpoint with proper REST)
- Add job read routes: list jobs per pipeline, get single job detail with output/error
- Add block category filtering and search query params to the existing blocks route
- Add Supabase JWT verification middleware so every route knows which user is making the request
- Add a dry-run code generation preview endpoint (`POST /pipelines/{id}/generate`)

## Capabilities

### New Capabilities

- `pipeline-crud`: Full lifecycle for pipelines — list, get, create, update, delete. Scoped per authenticated user.
- `job-history`: Read access to execution jobs — list by pipeline, get detail with output/error/status.
- `auth-middleware`: Supabase JWT verification that extracts `user_id` and scopes all queries to the requesting user.
- `block-filtering`: Category filter and text search on the block catalog endpoint.

### Modified Capabilities

- None. The existing block discovery and code generation logic are unchanged; we're only adding routes that expose what already exists.

## Scope

This is a **routes-only** change. The database schema, block registry, code generation engine, and Vast.ai execution logic are untouched. The new routes consume the same `PipelineTable`, `Job` model, and `BLOCK_REGISTRY` that already exist.
