## MODIFIED Requirements

### Requirement: Pipeline table schema

The database schema must use `nodes JSONB` and `edges JSONB` columns instead of a single `blocks JSONB` column. The `code` column is removed since code is generated on-the-fly from the graph.

#### MODIFIED SQL DDL

**FROM**:
```sql
CREATE TABLE pipelines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  blocks     JSONB DEFAULT '[]'    NOT NULL,  -- [{name, params, inputs}, ...]
  code       TEXT DEFAULT ''       NOT NULL,  -- Python généré
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**TO**:
```sql
CREATE TABLE pipelines (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  nodes      JSONB DEFAULT '[]' NOT NULL,  -- [{"id", "type", "params"}, ...]
  edges      JSONB DEFAULT '[]' NOT NULL,  -- [{"source", "source_port", "target", "target_port"}, ...]
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

**Migration**: Existing pipelines with `blocks` data must be migrated to `nodes` + `edges`. Since no real data exists (MVP stage), this is a clean schema replacement.

### Requirement: Code generation

#### MODIFIED Code storage

**Reason**: Code is no longer stored in the database. It's generated on-the-fly from the graph.

**FROM**: `POST /pipelines/save` generates code and stores it in `code` column.

**TO**: `POST /pipelines/{id}/generate` generates code from the graph on demand. `POST /pipelines/{id}/execute` generates code when execution starts — it calls `CodeGenerator(graph).generate()` internally. No `code` column needed.

