## 1. Auth Middleware

- [x] 1.1 Create `mlblock/server/auth.py` with `get_current_user` dependency that verifies Supabase JWTs using `jose.jwt`, extracts `sub` as `user_id`
- [x] 1.2 Add `SUPABASE_JWT_SECRET` env var loading; fail fast at startup if missing
- [x] 1.3 Export `get_current_user` from `mlblock/server/__init__.py` for route imports

## 2. Pipeline CRUD Routes

- [x] 2.1 Add `GET /api/pipelines` — list pipelines for authenticated user, ordered by `updated_at` desc, paginated
- [x] 2.2 Add `GET /api/pipelines/{pipeline_id}` — get pipeline detail, scoped to owner (404 for non-owners)
- [x] 2.3 Add `POST /api/pipelines` — create pipeline with `user_id` from JWT, validate graph, return detail (keep existing `POST /api/pipelines/save` as alias)
- [x] 2.4 Add `PUT /api/pipelines/{pipeline_id}` — update pipeline, scoped to owner, update `updated_at`
- [x] 2.5 Add `DELETE /api/pipelines/{pipeline_id}` — delete pipeline + cascade jobs, scoped to owner
- [x] 2.6 Add `POST /api/pipelines/{pipeline_id}/generate` — dry-run code generation without saving, returns generated code

## 3. Job History Routes

- [x] 3.1 Add `GET /api/pipelines/{pipeline_id}/jobs` — list jobs for a pipeline, scoped to pipeline owner, ordered by `created_at` desc
- [x] 3.2 Add `GET /api/jobs/{job_id}` — get job detail with output/error, scoped to owner

## 4. Block Filtering

- [x] 4.1 Add `?category=` query param to `GET /api/blocks` — filter by category name (case-insensitive)
- [x] 4.2 Add `?q=` query param to `GET /api/blocks` — search by name or description substring (case-insensitive)
- [x] 4.3 Add `GET /api/blocks/categories` — return list of `{ name, color, block_count }`

## 5. Wire Auth into Existing Routes

- [x] 5.1 Add `user_id: str = Depends(get_current_user)` to all pipeline/job route handlers
- [x] 5.2 Scope all existing `PipelineTable` queries by `user_id` in `list_pipelines`, `get_pipeline`, `update_pipeline`, `delete_pipeline`
- [x] 5.3 Ensure blocks routes remain public (no auth dependency)

## 6. Tests

- [x] 6.1 Test auth middleware: valid JWT, missing token, expired token, invalid signature
- [x] 6.2 Test pipeline CRUD: create, list, get, update, delete — all scoped to owner
- [x] 6.3 Test pipeline non-owner access returns 404 (not 403)
- [x] 6.4 Test job routes: list per pipeline, get detail, owner scoping
- [x] 6.5 Test block filtering: category filter, text search, combined filters, categories endpoint
