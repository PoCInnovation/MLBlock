## Context

The v1 spec describes a pipeline model (linear `blocks` list, numbered `out_N` references) that was designed early in the project but never implemented. The actual codebase evolved to use a full DAG graph model (`nodes` + `edges` with port-based connections). This change corrects the document to match reality.

Current spec sections needing correction:

| Section | Says | Should say |
|---|---|---|
| Pipeline (line 153) | Linear `blocks` list with `out_N` | Graph `nodes` + `edges` with port-based connections |
| SQL DDL (line 851) | `blocks JSONB` | `nodes JSONB`, `edges JSONB` |
| SQL DDL | No `code` column | No `code` column (generated on-the-fly) |
| App assembly | Not documented | `main.py` with CORS, routers, lifespan |
| Execute route | Reads `row.code` | Generates code from graph via `CodeGenerator` |

## Goals / Non-Goals

**Goals:**
- Correct the Pipeline section to describe the DAG model
- Correct the SQL DDL to match `nodes` + `edges`
- Add missing `main.py` app assembly documentation
- Update code examples to match the graph-based flow

**Non-Goals:**
- Changing any actual code
- Adding new features
- Modifying the routes table (already correct)

## Decisions

### 1. Replace linear model with graph model in Pipeline section

**Decision:** Rewrite the Pipeline section entirely. Show `nodes` + `edges` JSON instead of `blocks` list. Explain port-based connections instead of `out_N`.

**Why:** The codebase uses a graph model throughout — `Graph` class, topological sort, `GraphNode`, `Edge`. The document should describe what's actually built.

### 2. Keep the `out_N` convention in generated code only

**Decision:** The generated Python code still uses `out_1, out_2...` variable names for readability, but the pipeline definition uses named node IDs and ports.

**Why:** The `CodeGenerator` produces readable linear Python from the DAG. The generated code is an implementation detail, not the pipeline model.

### 3. Add main.py as documented section

**Decision:** Include the full `main.py` source in the spec so the app entry point is clear.

**Why:** It's 29 lines and answers "how is the app assembled?" — a question every developer will ask.

## Risks / Trade-offs

- **Document-API drift:** The spec could go out of sync again. Mitigation: add a note that `docs/mlblock_v1.md` is the authoritative design doc and should be updated alongside any model changes.
