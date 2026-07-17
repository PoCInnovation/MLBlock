## 1. Rewrite Pipeline Section (Linear → Graph)

- [ ] 1.1 Replace the Pipeline description (line 153) with graph model: explain `nodes`, `edges`, named node IDs, port-based connections
- [ ] 1.2 Replace the JSON example showing `blocks` list with the graph JSON format (`nodes` + `edges`)
- [ ] 1.3 Replace the `out_N` connection explanation with topological sort explanation
- [ ] 1.4 Update the generated code example to show that variable naming is a code generator concern, not the pipeline model

## 2. Correct SQL DDL

- [ ] 2.1 Replace `blocks JSONB` column with `nodes JSONB` + `edges JSONB` columns
- [ ] 2.2 Remove phantom `code TEXT` column
- [ ] 2.3 Add `description TEXT` column (exists in SQLModel, missing from DDL)
- [ ] 2.4 Change `id` from `UUID` to `INTEGER PRIMARY KEY AUTOINCREMENT` (matches SQLModel)
- [ ] 2.5 Remove `user_id` FK and `profiles` table (no auth integration yet; `user_id` is a placeholder string)

## 3. Add Server App Assembly

- [ ] 3.1 Add documentation for `mlblock/server/main.py` — FastAPI app creation, CORS config, lifespan handler
- [ ] 3.2 Document router registration: `blocks_router`, `pipelines_router`, `validation_router`

## 4. Update Code Generation & Execution Docs

- [ ] 4.1 Remove references to stored `code` column in execute route
- [ ] 4.2 Document that code is generated on-the-fly from graph via `CodeGenerator`

## 5. Clean Up Redundancies

- [ ] 5.1 Remove duplicate route implementations at end of Routes section (lines 450-500: old `POST /pipelines/save` and `GET /blocks` are superseded by the new versions above)
- [ ] 5.2 Remove the `profiles` table DDL (unreferenced ghost table)
- [ ] 5.3 Add note about document being authoritative for architecture decisions
