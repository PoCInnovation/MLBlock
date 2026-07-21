## Why

The current codebase is a local SQLite mockup with integer-based autoincrement IDs, no authentication, and no execution flow on remote GPUs. To launch MLBlock as an educational platform, the codebase must be migrated to the v1 specification: PostgreSQL via Supabase for multi-tenant storage, JWT validation for secure endpoints, and ephemeral GPU execution on Vast.ai with real-time status reporting.

## What Changes

- **Authentication Middleware**: Add JWT verification using the Shared JWT Secret from Supabase, securing all pipeline and block routes.
- **Data Model Migration**: Replace the SQLite SQLModel representation with PostgreSQL tables using UUID primary keys, and add tables for User Profiles, Jobs, and Job Outputs.
- **Pipeline Execution Endpoint**: Implement the Vast.ai orchestration logic inside `POST /pipelines/{id}/execute` to launch a T4 instance, run python with on-the-fly dependencies, and clean up the instance upon termination.
- **GPU Callback Router**: Implement endpoints for Vast.ai to report execution status, output snippets, and run errors.
- **Code Generation Update**: Adjust variable naming to resolve multi-output target ports and perform cycle validation on the pipeline DAG before execution.

## Capabilities

### New Capabilities
- `user-authentication`: Validate Supabase Auth JWTs on all user-facing HTTP routes and inject the user UUID into route handlers.
- `database-schema`: Define PostgreSQL/Supabase SQLModel tables with UUID keys and support for jsonb columns for nodes/edges storage.
- `database-connection`: Configure database engine and load credentials using percent-encoded password in connection string and load environment variables.
- `pydantic-models`: Redefine Pydantic models for API request/response validation (ParamInfo, Block, Category, Page, PipelineNode, PipelineEdge, PipelineCreate, PipelineUpdate, PipelineDetail).
- `block-specification`: Format existing blocks as standard callable Python functions with explicit docstrings and type hints.
- `block-discovery`: Implement directory scanning and parameter signature inspection to register and parse blocks dynamically.
- `gpu-execution`: Interface with Vast.ai APIs to launch and run pipeline scripts under Debian Bookworm containers.
- `gpu-callbacks`: Handle callback requests from GPU containers to stream progress, stdout snippet outputs, and errors, with automatic instance destruction.

### Modified Capabilities

## Impact
- `mlblock/server/models.py`: Update to define Postgres SQLModel tables (`Pipeline`, `Job`, `JobOutput`, `Profile`) with UUID primary keys.
- `mlblock/server/database.py`: Configure SQLModel engine to use `DATABASE_URL` with connection pooling.
- `mlblock/server/schemas.py` / `mlblock/server/routes.py`: Implement Pydantic API schemas, auth checks, execute flow, and GPU callbacks.
- `mlblock/blocks/` / `mlblock/blocks/registry.py`: Update all block functions to standard format and implement inspect-based registry scanning.
- `mlblock/core/generator.py`: Update variable naming logic to resolve multi-port outputs and enforce topological cycle checks.
- `tests/test_server.py`: Adjust unit tests to handle UUID mock inputs and mock auth/Vast.ai calls.
