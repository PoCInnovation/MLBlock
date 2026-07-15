## Why

The v1 architecture document (`docs/mlblock_v1.md`) describes a pipeline model that doesn't match the codebase. The Pipeline section shows a linear block list (`{name, params, inputs}` with `out_N` references), but the actual code uses a full DAG graph model (`nodes` + `edges` with port-based connections). The SQL DDL references a `blocks JSONB` column that doesn't exist in the SQLModel, and references a `code` column that the codebase generates on-the-fly rather than storing. This inconsistency will confuse anyone onboarding or building the frontend against the real API.

## What Changes

- **Pipeline section**: Rewrite from linear `blocks` model to DAG `nodes` + `edges` model, with topological sort explanation and port-based connection examples
- **SQL DDL**: Replace `blocks JSONB` with `nodes JSONB` + `edges JSONB`, remove phantom `code` column
- **Server section**: Add `main.py` app assembly documentation (CORS, router registration, lifespan)
- **Pipeline execution**: Update code examples to match the graph-based `CodeGenerator` flow instead of reading from a stored `code` column
- **BREAKING**: The Pipeline section's JSON example format changes from linear to graph. Frontend developers must update their mental model.

## Capabilities

### New Capabilities

- None. This is purely a document correction — no new features.

### Modified Capabilities

- `pipeline-spec`: The pipeline data model spec is being corrected from a linear `blocks` list to a graph `nodes` + `edges` model. This affects the Pipeline section, example payloads, and code generation documentation.
- `database-schema`: The database schema documentation is being corrected to match the actual `Pipeline` SQLModel table with `nodes JSONB` and `edges JSONB` columns.

## Scope

Document-only. No code changes, no database migrations, no new routes. Only `docs/mlblock_v1.md` is modified.
