## Context

The MLBlock v1 backend has three routes and three database tables. The routes (`GET /blocks`, `POST /pipelines/save`, `POST /pipelines/{id}/execute`) cover only a fraction of what the data model supports. Pipelines have no list/read/update/delete, jobs have no read, and there's no auth middleware despite `user_id` FKs on every table. The frontend needs these routes to build any meaningful UI.

Current server structure: FastAPI with `blocks_router`, `pipelines_router`, `validation_router` under `/api/` prefix. SQLModel for ORM. No auth layer.

## Goals / Non-Goals

**Goals:**
- Expose full pipeline CRUD scoped per authenticated user
- Expose job read routes (list per pipeline, get detail)
- Add Supabase JWT verification middleware
- Add block category filtering and text search
- Keep changes minimal — routes only, no schema or engine changes

**Non-Goals:**
- Modifying the database schema (tables already have what we need)
- Changing block discovery, code generation, or Vast.ai execution logic
- Building a full auth system (Supabase handles that; we just verify JWTs)
- Adding webhooks, pagination beyond simple offset, or rate limiting
- Implementing block favorite/bookmark features

## Decisions

### 1. Auth: Supabase JWT verification via `fastapi-jwt` or manual verification

**Decision:** Use `jose.jwt` (already a transitive dep of Supabase) to verify Supabase JWTs manually. Extract `sub` claim as `user_id`. Inject via FastAPI `Depends()`.

**Why not a full auth library:** Supabase owns the auth flow. We just need to verify the JWT is valid and extract the user ID. No refresh tokens, no session management — that's Supabase's job.

**Why not `fastapi-jwt-auth`:** Extra dependency for 20 lines of code. The verification is: decode JWT with Supabase's JWT secret, check expiry, extract `sub`.

### 2. Pipeline routes: Replace `/save` with standard REST

**Decision:** Keep `POST /pipelines/save` as-is for backward compatibility, but add `POST /pipelines` as the canonical create endpoint. Both work identically.

**Why keep `/save`:** The frontend may already call it. No reason to break it.

**Alternative considered:** Remove `/save` entirely. Rejected — unnecessary breaking change for no gain.

### 3. Job routes: Nested under pipeline

**Decision:** `GET /pipelines/{id}/jobs` for listing, `GET /jobs/{job_id}` for single job detail.

**Why:** Jobs belong to a pipeline. The list is naturally scoped. But a single job lookup by ID is useful for direct links ("share this run").

### 4. Block filtering: Query params on existing route

**Decision:** Add `?category=` and `?q=` query params to `GET /blocks`.

**Why not separate routes:** The block list is small (~60 items). Client-side filtering would work too, but server-side is trivial and keeps the contract clean.

### 5. Scope every query by `user_id`

**Decision:** All pipeline/job queries add `.where(PipelineTable.user_id == user_id)`. No route returns data from other users.

**Why:** The database schema already has `user_id` FKs. This is just enforcing what the schema implies.

## Risks / Trade-offs

- **JWT secret management:** The Supabase JWT secret must be configured as an env var (`SUPABASE_JWT_SECRET`). Missing it = all auth fails. Mitigation: fail fast at startup if not set.
- **No refresh token handling:** If the JWT expires, the client gets 401. Supabase SDK handles refresh on the client side — this is fine for v1.
- **`/save` duplication:** Two create endpoints is slightly messy. Acceptable for v1; can clean up in v2.
