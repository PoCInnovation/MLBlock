## 1. Database Migration

- [x] 1.1 Update `mlblock/server/models.py` to use UUID primary keys for the `Pipeline` table and define `Job`, `JobOutput`, and `Profile` tables.
- [x] 1.2 Update `mlblock/server/database.py` to read `DATABASE_URL` from the environment and configure connection pooling for PostgreSQL.
- [x] 1.3 Modify the database table initialization in `init_db()` to run on the PostgreSQL engine.
- [x] 1.4 Create the local `.env` file containing the percent-encoded `DATABASE_URL` with password `airbaG42%3F133` and verify direct connection.
- [x] 1.5 Implement Pydantic API schemas (ParamInfo, Category, Block, Page, PipelineNode, PipelineEdge, PipelineCreate, PipelineUpdate, PipelineDetail) in `mlblock/server/schemas.py`.

## 2. Authentication Middleware

- [x] 2.1 Implement `get_current_user` in `mlblock/server/auth.py` using `python-jose` to validate bearer JWT tokens against `SUPABASE_JWT_SECRET`.
- [x] 2.2 Secure all user-facing pipeline and block endpoints in `mlblock/server/routes.py` by adding the `Depends(get_current_user)` authentication dependency.

## 3. Code Generator Updates

- [x] 3.1 Update the topological sort validation in the generator or graph core to check for cycle presence and raise a `ValueError` on detection.
- [x] 3.2 Update the code generator output variable mapping to resolve port names (e.g. `out_n2_X_train`) for source blocks with multiple outputs.
- [x] 3.3 Reformat all existing block functions (in `mlblock/blocks/`) to follow standard docstring and type hint signatures.
- [x] 3.4 Implement recursive directory scanning, function signature parsing, and package import dependency mapping in `mlblock/blocks/registry.py`.

## 4. GPU Orchestration & Callbacks

- [x] 4.1 Update the execution endpoint (`POST /pipelines/{id}/execute`) to rent a T4 instance using `ghcr.io/astral-sh/uv:python3.13-bookworm` and execute the base64-encoded Python script.
- [x] 4.2 Secure callback routes in `mlblock/server/gpu_auth.py` using a shared `GPU_API_KEY` verification check.
- [x] 4.3 Implement callback endpoints (`POST /jobs/{job_id}/status`, `/jobs/{job_id}/output`, `/jobs/{job_id}/error`) to record execution progress.
- [x] 4.4 Implement Vast.ai instance destruction in the status/error callbacks upon job completion or failure.

## 5. Verification & Testing

- [x] 5.1 Adjust tests in `tests/test_server.py` and other test files to use mock UUIDs and mock authentication headers.
- [x] 5.2 Verify that the complete test suite passes using `pytest`.
- [x] 5.3 Install Supabase Agent Skills via `npx skills add supabase/agent-skills` for the workspace.
