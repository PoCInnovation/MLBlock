## Context

The current backend implementation of MLBlock is a local mockup using SQLite and integer primary keys, with no real-world execution or tenant isolation features. To align the codebase with the `docs/mlblock_v1.md` specification, we must transition to a production-ready model where:
- A PostgreSQL database (hosted on Supabase) stores user profiles, pipelines, jobs, and job outputs.
- API endpoints are authenticated using Supabase Auth JWTs (HS256 signature validation).
- Pipelines are compiled and executed on rented Vast.ai T4 GPUs, with callback notifications securing the execution lifecycle.

## Goals / Non-Goals

**Goals:**
- Port the local SQLite SQLModel structure to multi-tenant PostgreSQL tables with UUID primary keys.
- Implement JWT authentication verification using the shared `SUPABASE_JWT_SECRET`.
- Build the `POST /pipelines/{id}/execute` orchestration handler using the `VastAI` Python client wrapper.
- Secure GPU callbacks using a shared `GPU_API_KEY` header checks and automatically trigger instance termination when runs complete or fail.
- Adjust the Python code generator (`generate_code`) to perform topological cycle verification and correctly resolve multi-output port variables in input arguments.

**Non-Goals:**
- Creating a frontend visual editor or implementing OAuth UI callback flows (this design focuses solely on the FastAPI backend).
- Setting up permanent database migration tools like Alembic (since the project is in the MVP stage, table creation at startup using SQLModel is sufficient).

## Decisions

### Decision 1: Database Schema & Engine Configuration
We will replace SQLite with PostgreSQL/Supabase.
- **Rationale**: SQLModel models will map to Supabase PostgreSQL tables. All primary keys for `Pipeline`, `Job`, `JobOutput`, and `Profile` tables will be changed to `uuid.UUID` to prevent auto-increment enumeration attacks. The database URL will be loaded from the `.env` file via `python-dotenv`. Since the database password `airbaG42?133` contains the special character `?` (which delimits query parameters in RFC 3986), we must percent-encode it as `%3F` in the `DATABASE_URL` connection string to avoid URI parsing failures.
- **Alternatives Considered**: Keeping SQLite was rejected because SQLite does not support native concurrency for multi-tenant callbacks and lacks compatibility with hosted Supabase features. Leaving the password unencoded was rejected as it causes SQLModel connection parsing crashes.

### Decision 2: FastAPI Auth Dependency with python-jose
We will implement user authentication using JWT decode checks from `python-jose`.
- **Rationale**: We need to parse and verify the header `Authorization: Bearer <jwt>` against `SUPABASE_JWT_SECRET` with audience validation set to `"authenticated"`. Using `jose` allows clean validation and exception trapping (`jwt.ExpiredSignatureError`, `JWTError`).
- **Alternatives Considered**: `PyJWT` was considered, but `python-jose` matches the project requirement and simplifies decoding Supabase-specific JWT audience claims.

### Decision 3: Vast.ai Container Image selection (glibc support)
We will launch Vast.ai T4 containers using `ghcr.io/astral-sh/uv:python3.13-bookworm`.
- **Rationale**: Debian Bookworm is glibc-compliant, which allows scientific libraries (like `torch` and `pandas`) to download precompiled wheels directly. Alpine Linux uses musl libc, which would require compiling these packages from source, causing massive execution delays on container cold starts.
- **Alternatives Considered**: `ghcr.io/astral-sh/uv:python3.13-alpine` was rejected due to dependency compilation failures and lack of prebuilt wheels.

### Decision 4: Automatic GPU Instance Cleanup on Termination
We will call `VastAI.destroy_instance` in the terminal callback handlers.
- **Rationale**: Rented instances at Vast.ai continue to accumulate charges for compute and storage. Triggering `destroy_instance` inside `update_job_status` (when status is `done` or `error`) and `push_job_error` ensures instances are deleted immediately after execution completes.

### Decision 5: Pydantic Schemas Definition
We will define all API validation models in a new file `mlblock/server/schemas.py`.
- **Rationale**: Placing models in a dedicated file avoids circular imports and keeps models clean, separating API layer validation from SQLModel database models.

### Decision 6: Standardized Function Blocks
Every block in the registry will be implemented as a plain, callable Python function.
- **Rationale**: Standardizing blocks as plain functions makes them testable, readable, and simple, using docstrings for description and type hints for data contracts.

### Decision 7: Registry Scanning and Import Dependency Mapping
We will implement automated directory scanning using `inspect` and package mapping.
- **Rationale**: By using `inspect.signature` and importing files dynamically from category directories, we discover blocks on server startup. Dependencies are extracted from the containing module file and mapped using an explicit dictionary (e.g. `sklearn` -> `scikit-learn`) for reliable remote packaging.
## Risks / Trade-offs

- **[Risk: Instance Startup Latency]** $\rightarrow$ Rented GPU instances take 30-45 seconds to boot and download dependencies via `uv run`. 
  * *Mitigation*: We implement `time.sleep(15)` to delay the script execution and set job status to `queued` so the frontend can notify the user of the pending initialization.
- **[Risk: Vast.ai API failure]** $\rightarrow$ Calls to delete instances might fail due to network glitches, causing orphaned instances to run indefinitely.
  * *Mitigation*: We wrap `vast.destroy_instance` calls inside a broad `try/except` block to prevent route failure, and logs are kept to track errors.
