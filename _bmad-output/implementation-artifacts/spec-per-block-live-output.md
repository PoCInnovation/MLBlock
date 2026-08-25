---
title: 'Per-block live output — GPU → DB → Inspecteur'
type: 'feature'
created: '2026-08-24'
status: 'done'
review_loop_iteration: 1
baseline_commit: 'cead2f8da917c5a7ba835faf5cf56c5fc154fe90'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `Inspecteur` is a placeholder (`Sélectionne un bloc`) with a badge dot but no per-block detail, while `Console Résultat` is a flat lighter timeline (`block finished + full result`). After a pipeline runs, the user cannot see live, detailed output per `blockId` in `Inspecteur` without waiting for the whole job.

**Approach:** Make `Inspecteur` live per `blockId`: `CodeGenerator` emits `notify_block_output(block_id, block_type, output)` per node (case `block_id` = `node.id`), GPU `POST`s per-block to `main` DB `job_outputs` (`block_id` indexed), frontend `Inspecteur` subscribes via Supabase `Realtime` (fallback polling) and renders detailed per-block cards (vs `Console` light `finished`). Keep `Console` light, keep left `Cours` watcher untouched, keep `Vast` keep-alive.

## Boundaries & Constraints

**Always:** Add `block_id` to `JobOutputPush` + `JobOutput` table (indexed, keep `block_name` for compat); `CodeGenerator` `_serialize_output` per node emits `notify_output({block, block_id, output})` with `block_id = node.id` (type for display, id for mapping); `backend/mlblock/server/routes.py` `POST /jobs/{id}/output` accepts `block_id` and inserts `JobOutput(job_id, block_name, block_id, output)`; `GET /jobs/{id}/outputs` returns `block_id`; frontend `Inspecteur` when `rightMode==="inspecteur"` and `selected` node shows its `block_id` card live via `supabase.channel('job:'+jobId).on('postgres_changes', {event:'INSERT', schema:'public', table:'job_outputs', filter: 'job_id=eq.'+jobId})` + polling fallback 2s; `Console` stays light `finished` + `full`; `Vast` keep instance until final done/error/timeout; instant, French.

**Ask First:** Switching `GPU → Supabase` direct `service_role` write (bypass `BACKEND_URL`) to eliminate hop; changing `job_outputs` to store `port`/`output_index` for multi-output blocks.

**Never:** Reveal `expected` DAG; touch left `FlowPalette` or `Cours` markdown/watcher (deferred B/C already shipped); animate per-block cards (instant); drop `block_name` column (backward compat); break `GET /jobs/{id}/status|error` callbacks.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| GPU per-block | `node.id="abc-123" type="train_model"` finishes, output `{"loss":0.12}` | `POST /api/jobs/{id}/output` `{"block":"train_model","block_id":"abc-123","output":"{\"loss\":0.12}"}` → `job_outputs` row `block_id=abc-123` → `Inspecteur` card for `abc-123` shows `loss 0.12` live | Missing `block_id` → fallback to `block_name` only, still inserted but not selectable by `block_id` |
| Inspecteur live | `rightMode==="inspecteur"`, selected `abc-123`, Realtime INSERT | Card for `abc-123` appears/updates instantly, `Console` still shows `train_model finished` light | Realtime not available → polling `GET /outputs` every 2s, same data |
| Console light | Job running | `Console` shows `train_model finished` per block (light) + final `full result` at end | Per-block detail not duplicated in Console |
| Multi-output | `split_data` with `out_train`/`out_test` | Two `notify_output` with same `block_id` but different `output` JSON (contains port data) → `Inspecteur` shows both or latest | `output` too large → truncate + `console.warn` |
| Build | `npm run build` + `uv run pytest` | `tsc` passes, `vite` builds, 105 tests pass, no layer clash | `job_outputs` migration missing → 500 on POST, log warning |

</frozen-after-approval>

## Code Map

- `backend/mlblock/core/generator.py:1` -- `generate_code()` topological loop `notify_status(type,'running')` → `out_N = Block(...)` → `notify_output(type, json.dumps(_serialize_output(out_N)))` → `notify_status(type,'done')` -- emit `block_id` alongside `block` per node, keep `type` for display, `id` for mapping, multi-output `out_N['port']`.
- `backend/mlblock/core/pipeline.py:1` -- `Pipeline.generate_code()` delegates to `CodeGenerator`, `run()` local topological -- keep parity, no HTTP.
- `backend/mlblock/core/vast.py:1` -- `VastAI` `search_offers`/`launch_instance` with `onstart` gzip+base64 (deps+env+code) -- keep keep-alive until final, inject `BACKEND_URL`/`GPU_API_KEY`/`JOB_ID` for per-block callbacks.
- `backend/mlblock/server/models.py:18` -- `Job` 1—N `JobOutput` currently `JobOutput(id, job_id FK CASCADE, block_name:str, output:str, created_at)` -- add `block_id: str|UUID indexed` + keep `block_name` alias.
- `backend/mlblock/server/routes.py:18` -- Routers `execute_pipeline` → `generate_code` → `_run_local` or Vast `onstart`, `POST /jobs/{id}/status` `JobStatusUpdate{block,status}`, `POST /jobs/{id}/output` `JobOutputPush{block,output}` → `JobOutput(job_id,block_name,output)`, `GET /jobs/{id}/outputs` returns `[{block_name,output,created_at}]` -- accept `block_id` optional, return it.
- `frontend/src/components/flow/FlowCanvas.tsx:640` -- `InspectorPanel` placeholder `Sélectionne un bloc` + `rightMode` `cours|inspecteur` toggle, badge `hasOutputs` via `results.length` -- to be wired to `job_outputs` Realtime per `block_id` when `selected` node.
- `frontend/src/components/ui/ConsolePanel.tsx:29` -- `console-panel` `floating-panel` with `height 48↔180` animation, placeholder vs logs -- keep light `finished` + `full`, not per-block detailed.
- `frontend/src/store/useAppStore.ts:35` -- `flowNodes:Node[]` `data:{type}` + `flowEdges:Edge[]` + `jobOutputs?`/`results` -- store for `Inspecteur` subscription, no left `FlowPalette` change.

## Tasks & Acceptance

**Execution:**
- [x] `backend/mlblock/server/models.py` -- add `block_id: str = Field(index=True, nullable=True)` to `JobOutput` (keep `block_name`), generate Alembic/SQL migration `ALTER TABLE job_outputs ADD COLUMN block_id TEXT; CREATE INDEX idx_job_outputs_block_id ON job_outputs(block_id);` -- keep `block_name` for compat.
- [x] `backend/mlblock/server/routes.py` -- extend `JobOutputPush(BaseModel)` with `block_id: str | None = None` (keep `block: str`), update `POST /jobs/{id}/output` handler to `JobOutput(job_id=job.id, block_name=body.block, block_id=body.block_id or body.block, output=body.output)`; update `GET /jobs/{id}/outputs` to return `block_id`; keep `verify_gpu_key`.
- [x] `backend/mlblock/core/generator.py` -- in per-node loop, emit `notify_output(json.dumps({"block": node.type, "block_id": node.id, "output": _serialize_output(out_N)}))` (or `block_id` param) instead of `notify_output(node.type, ...)`; for multi-output blocks, emit per `out_N[port]` with same `block_id` + port in output JSON; keep `notify_status(block,block_id,status)` similarly; ensure `onstart` payload still <4048 after adding block_id (gzip).
- [x] `frontend/src/store/useAppStore.ts` -- add `jobOutputs: JobOutput[]` + `setJobOutputs` + Realtime channel `supabase.channel('job:'+jobId).on('postgres_changes', {event:'INSERT', schema:'public', table:'job_outputs', filter: 'job_id=eq.'+jobId}, payload=> setJobOutputs([...jobOutputs, payload.new]))` with fallback `setInterval GET /jobs/{id}/outputs 2000ms` when Realtime unavailable; keep `flowNodes`/`flowEdges` untouched.
- [x] `frontend/src/components/flow/FlowCanvas.tsx:640` -- `InspectorPanel({selectedId})` when `rightMode==="inspecteur"` and `selected` node (`flowNodes.find(n=>n.selected)`) shows per-block card(s) for `block_id===selected.id` from `jobOutputs` (detailed: `output` JSON pretty, shape, logs), instant, French, `Divider` between cards; when no `selected` → placeholder `Sélectionne un bloc`; when `selected` but no output yet → `En attente…`; `Console` stays light via existing `ConsolePanel` (no change).

**Acceptance Criteria:**
- Given a pipeline with `load_csv` `id=abc`, when GPU finishes `abc`, then `POST /api/jobs/{id}/output` with `block_id=abc` creates `job_outputs` row and `GET /outputs` returns `block_id`, and `Inspecteur` with `abc` selected shows live card instantly (Realtime or polling).
- Given `Inspecteur` with `abc` selected and no output yet, then shows `En attente…` French, not error.
- Given `Console` during run, then shows light `load_csv finished` per block and final `full result`, not per-block detailed JSON.
- Given `npm run build` + `uv run pytest mlblock/tests -q` (105), then `tsc` passes, `vite` builds, no layer clash, `job_outputs` migration applied.
- Given missing `block_id` in old `POST`, then still inserts with `block_name` fallback and `Inspecteur` shows via `block_name` when `block_id` null.

## Spec Change Log

## Design Notes

`block_id` is `node.id` (`${type}_${Date.now()}`) not `type` to disambiguate duplicate types (e.g., two `train_model`). Keep `block_name` for backward compat and display. Realtime `supabase.channel` per `job_id` is cheap; fallback polling 2s covers paused Supabase free tier. `codegen` `_serialize_output` already handles `Tensor`/`DataFrame` preview; just wrap with `block_id`. `Console` light path stays via `notify_status`/`notify_output` final, not per-block detailed.

## Verification

**Commands:**
- `uv run alembic upgrade head` or `psql -f migration.sql` -- expected: `job_outputs` has `block_id` + index, no data loss
- `npm --prefix frontend run build` -- expected: `tsc --noEmit` passes, Vite builds `dist`, no `supabase` Realtime type errors
- `npm --prefix frontend test -- --run` -- expected: 53 passed
- `uv run pytest mlblock/tests -q` -- expected: 105 passed (including new `block_id` compat test)

**Manual checks (if no CLI):**
- Run `predire-valeur-csv` pipeline, click `Charger CSV` block, switch to `Inspecteur`, verify live card appears per block as GPU streams, not only at end
- Check `Supabase Table Editor` `job_outputs` has `block_id` filled, `block_name` still present
- Verify `Console` shows `finished` light and final, not detailed per-block JSON
- Disconnect Realtime (offline), verify polling fallback still shows outputs within 2s

## Suggested Review Order

**Entry — Per-block live output**
- GPU → DB job_outputs per block_id with block_name compat
  [`models.py:68`](../../backend/mlblock/server/models.py#L68)

**Backend — generator & routes**
- CodeGenerator emits block_id per node
  [`generator.py:46`](../../backend/mlblock/core/generator.py#L46)
- JobOutputPush block_id and POST handler
  [`routes.py:586`](../../backend/mlblock/server/routes.py#L586)

**Frontend — Inspecteur vs Console**
- Inspecteur live per selected blockId via Realtime/polling
  [`FlowCanvas.tsx:724`](../../frontend/src/components/flow/FlowCanvas.tsx#L724)
- Store jobOutputs and useBlockRunner polling
  [`useAppStore.ts:130`](../../frontend/src/store/useAppStore.ts#L130)

**Peripherals**
- Build and 53 tests green
  [`FlowCanvas.tsx:1`](../../frontend/src/components/flow/FlowCanvas.tsx#L1)
