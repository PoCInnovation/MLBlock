# Execution Chain, useJobRunner Unification, Category Colors & Dead Code Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix and unify the end-to-end execution chain (local callback auth, backend cancel endpoint, and a central `useJobRunner` hook), replace framework badges with category color coding, eliminate duplicate utils/store state, and clean confirmed dead code.

**Architecture:** 
The backend unifies callback authentication on `"mock-gpu-key"` and exposes `POST /api/jobs/{id}/cancel` backed by `LocalBackend` process tracking (`Popen.terminate`/`kill`).
The frontend merges execution into `frontend/src/hooks/useJobRunner.ts`, wire `onStop` to `cancelJob`, deduplicates `toServerPayload` to `pipelineDocument.ts`, and updates `BlockCard.tsx` to display category badges and hex colors from the catalog.

**Tech Stack:** FastAPI, SQLModel, PyTorch, React 19, TypeScript, TanStack Query, Zustand, Vitest, Pytest.

**Spec:** `docs/superpowers/specs/2026-10-13-execution-chain-and-dead-code-design.md`

## Global Constraints

- Backend runtime: Python >=3.10 with `uv` (`uv run pytest`, `uv run ruff`).
- Frontend runtime: Node >=20 with `pnpm` (`pnpm test`, `pnpm exec tsc --noEmit`, `pnpm run build`).
- Do NOT delete `frontend/src/utils/connection.ts` or `frontend/src/utils/courseWatcher.ts` (explicitly reserved for future interactive courses/validation).
- Preserve all 198 backend tests and 131 frontend tests without regression.

## Review Focus

1. Cancelling an already-completed job must return 200 without raising an error or attempting to kill non-existent processes.
2. Local execution callbacks (`POST /api/jobs/{id}/status` and `/output`) with default mock keys must succeed with 200 instead of 403 Forbidden.
3. SuperBlocks without an explicit category must correctly resolve category from their first child block or fallback cleanly without crashing.
4. Calling `toServerPayload` with nested containers must retain children arrays across all callers.
5. In `JournalPanel`, clicking "Lancer" must immediately display live execution state and console lines without an empty "Aucune exécution" flash.

---

### Task 1: Backend Execution Fixes & Cancellation Endpoint

**Files:**
- Modify: `backend/mlblock/server/gpu_auth.py:7`
- Modify: `backend/mlblock/execution.py:28-45`
- Modify: `backend/mlblock/server/routes.py:890-940`
- Test: `backend/mlblock/tests/test_server.py`

**Interfaces:**
- Produces: `POST /api/jobs/{job_id}/cancel` returning `Job` with `status: "cancelled"`
- Produces: `LocalBackend.cancel(job_id: UUID) -> None`
- Consumes: `verify_gpu_key` expecting `Bearer mock-gpu-key` by default

- [ ] **Step 1: Write failing tests for GPU auth default and cancel endpoint**

In `backend/mlblock/tests/test_server.py`:
```python
def test_gpu_key_auth_default_matches_local_backend(client: TestClient):
    # Verify default GPU_API_KEY ("mock-gpu-key") is accepted on callback routes
    resp = client.post(
        f"/api/jobs/{uuid4()}/status",
        headers={"Authorization": "Bearer mock-gpu-key"},
        json={"block": "test", "status": "running"},
    )
    # Should not be 403 (it can be 404 since job doesn't exist, but NOT 403 Invalid GPU key)
    assert resp.status_code != 403


def test_cancel_job_endpoint(client: TestClient, sample_pipeline_id):
    # Execute a pipeline to create a job
    exec_resp = client.post(f"/api/pipelines/{sample_pipeline_id}/execute")
    assert exec_resp.status_code == 200
    job_id = exec_resp.json()["id"]

    # Cancel the job
    cancel_resp = client.post(f"/api/jobs/{job_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"
    assert cancel_resp.json()["completed_at"] is not None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `BACKEND_TIMEOUT=1 uv run pytest backend/mlblock/tests/test_server.py -k "test_gpu_key_auth_default or test_cancel_job_endpoint" -v`
Expected: FAIL (403 on auth test or 404 on `/cancel` route)

- [ ] **Step 3: Implement GPU key alignment, process tracking, and cancel route**

1. In `backend/mlblock/server/gpu_auth.py`:
   Change default `GPU_API_KEY` from `"mock-gpu-key-for-testing"` to `"mock-gpu-key"`.
2. In `backend/mlblock/execution.py`:
   Add `_processes: dict[UUID, subprocess.Popen] = {}` to `LocalBackend`.
   In `LocalBackend.launch(code, job_id)`:
   Store `proc = subprocess.Popen(...)` in `self._processes[job_id]`.
   Add `LocalBackend.cancel(job_id: UUID)`:
   If `job_id in self._processes`, terminate process (`proc.terminate()`), wait 1s, kill (`proc.kill()`) if still alive, and remove from `_processes`.
3. In `backend/mlblock/server/routes.py`:
   Add route:
   ```python
   @jobs_router.post("/{job_id}/cancel")
   def cancel_job(
       job_id: UUID,
       user_id: str = Depends(get_current_user),
       session: Session = Depends(get_session),
   ) -> Job:
       job = session.get(Job, job_id)
       if not job:
           raise HTTPException(status_code=404, detail="Job not found")
       pipeline = session.get(PipelineTable, job.pipeline_id)
       if not pipeline or str(pipeline.user_id) != user_id:
           raise HTTPException(status_code=404, detail="Job not found")
       if job.status in ("queued", "dispatched", "running"):
           if _is_mock_vast():
               LocalBackend().cancel(job_id)
           else:
               VastBackend().destroy(job.vast_instance_id)
           job.status = "cancelled"
           job.completed_at = datetime.now(timezone.utc)
           session.add(job)
           session.commit()
           session.refresh(job)
       return job
   ```

- [ ] **Step 4: Run test to verify it passes**

Run: `BACKEND_TIMEOUT=1 uv run pytest backend/mlblock/tests/test_server.py -k "test_gpu_key_auth_default or test_cancel_job_endpoint" -v`
Expected: PASS

- [ ] **Step 5: Run full backend test suite to prevent regressions**

Run: `BACKEND_TIMEOUT=1 uv run pytest backend/mlblock/tests -q`
Expected: 198+ passed

- [ ] **Step 6: Commit backend changes**

```bash
git add backend/mlblock/server/gpu_auth.py backend/mlblock/execution.py backend/mlblock/server/routes.py backend/mlblock/tests/test_server.py
git commit -m "fix(backend): align GPU_API_KEY default and add job cancellation endpoint"
```

---

### Task 2: API Client Cancel Function & Dead Code Deletion

**Files:**
- Modify: `frontend/src/api/client.ts:280-300`
- Delete: `frontend/src/components/flow/FlowPalette.tsx`
- Delete: `frontend/src/components/ui/ResultsPanel.tsx`
- Delete: `frontend/src/components/ui/hover-card.tsx`
- Delete: `frontend/src/lib/utils.ts`
- Modify: `frontend/package.json:31`
- Modify: `backend/AGENTS.md` & `AGENTS.md` (add dead code hygiene rule)

**Interfaces:**
- Produces: `cancelJob(id: string): Promise<Job>` in `frontend/src/api/client.ts`
- Consumes: `POST /api/jobs/{id}/cancel`

- [ ] **Step 1: Add `cancelJob` in `frontend/src/api/client.ts`**

Add to `frontend/src/api/client.ts`:
```typescript
export async function cancelJob(id: string): Promise<Job> {
  const { data } = await http.post<unknown>(`/api/jobs/${id}/cancel`)
  return parseOrThrow(jobSchema, `POST /api/jobs/${id}/cancel`, data)
}
```

- [ ] **Step 2: Delete dead files**

Remove confirmed unused files:
- `rm frontend/src/components/flow/FlowPalette.tsx`
- `rm frontend/src/components/ui/ResultsPanel.tsx`
- `rm frontend/src/components/ui/hover-card.tsx`
- `rm frontend/src/lib/utils.ts`

- [ ] **Step 3: Remove unused `nitro` dependency from `frontend/package.json`**

In `frontend/package.json`: remove line `"nitro": "^3.0.260610-beta",`.
Run: `pnpm install` in `frontend/`.

- [ ] **Step 4: Add dead code hygiene rule to `AGENTS.md`**

In `AGENTS.md` and `20-Casquettes/mlblock/AGENTS.md`:
Add under Code Conventions / Frontend Guidelines:
```markdown
- **Dead Code & Hygiene**: Orphan components, shims, and unused exports are strictly forbidden. Before opening a PR or completing tasks, run `pnpm dlx knip --no-exit-code` to audit and clean dead files.
```

- [ ] **Step 5: Verify frontend compilation and tests**

Run: `pnpm exec tsc --noEmit && pnpm test` in `frontend/`
Expected: 0 TS errors, 131 tests passing.

- [ ] **Step 6: Commit Task 2 changes**

```bash
git add frontend/src/api/client.ts frontend/package.json pnpm-lock.yaml AGENTS.md 20-Casquettes/mlblock/AGENTS.md
git rm frontend/src/components/flow/FlowPalette.tsx frontend/src/components/ui/ResultsPanel.tsx frontend/src/components/ui/hover-card.tsx frontend/src/lib/utils.ts
git commit -m "refactor(frontend): add cancelJob API, remove dead files and unneeded nitro dep"
```

---

### Task 3: Unification of `toServerPayload` & Store Outputs

**Files:**
- Modify: `frontend/src/utils/blockHelpers.ts`
- Modify: `frontend/src/main.tsx:9`
- Modify: `frontend/src/routes/__root.tsx:8`
- Modify: `frontend/src/pages/EditorPage.tsx:7`
- Modify: `frontend/src/store/useAppStore.ts:53,98,306`

**Interfaces:**
- Produces: `toServerPayload` exclusively from `frontend/src/store/pipelineDocument.ts`
- Modifies: `useAppStore` to use `jobOutputs` as primary, keeping `@deprecated results` synchronized

- [ ] **Step 1: Redirect callers of `toServerPayload` to `pipelineDocument.ts`**

1. In `frontend/src/main.tsx`:
   Change `import { toServerPayload } from './utils/blockHelpers'` to `import { toServerPayload } from './store/pipelineDocument'`.
2. In `frontend/src/routes/__root.tsx`:
   Change `import { toServerPayload } from '../utils/blockHelpers'` to `import { toServerPayload } from '../store/pipelineDocument'`.
3. In `frontend/src/pages/EditorPage.tsx`:
   Change `import { toServerPayload } from '../utils/blockHelpers'` to `import { toServerPayload } from '../store/pipelineDocument'`.
4. In `frontend/src/utils/blockHelpers.ts`:
   Remove redundant `toServerPayload` and unused `colorFor`.

- [ ] **Step 2: Clean and deprecate `results` in `useAppStore.ts`**

In `frontend/src/store/useAppStore.ts`:
Mark `results: JobOutput[]` with `/** @deprecated Use jobOutputs */`.
Keep `setJobOutputs` updating `jobOutputs` and `results` for backward compatibility.
Ensure `clearAll` clears both.

- [ ] **Step 3: Run TypeScript checks and tests**

Run: `pnpm exec tsc --noEmit && pnpm test` in `frontend/`
Expected: 0 errors, 131 tests passing.

- [ ] **Step 4: Commit Task 3 changes**

```bash
git add frontend/src/main.tsx frontend/src/routes/__root.tsx frontend/src/pages/EditorPage.tsx frontend/src/utils/blockHelpers.ts frontend/src/store/useAppStore.ts
git commit -m "refactor(frontend): unify toServerPayload on pipelineDocument and clean store outputs"
```

---

### Task 4: Implementation of `useJobRunner.ts` & Editor/Journal Integration

**Files:**
- Rename/Create: `frontend/src/hooks/useJobRunner.ts` (from `jobRunner.ts`)
- Modify: `frontend/src/hooks/useBlockRunner.ts` (re-export or delegate to `useJobRunner`)
- Modify: `frontend/src/components/editor/EditorHeader.tsx:18,34`
- Modify: `frontend/src/components/flow/JournalPanel.tsx:74-125`

**Interfaces:**
- Produces: `useJobRunner()` returning `{ onRun, onStop, onClear, isPending, isStopping, isError, jobId, status, job, outputs, consoleLines }`
- Consumes: `cancelJob`, `executePipeline`, `getJob`, `getJobOutputs`, `toServerPayload` from `pipelineDocument`

- [ ] **Step 1: Write `useJobRunner.ts` implementation**

Move `frontend/src/hooks/jobRunner.ts` to `frontend/src/hooks/useJobRunner.ts`.
Implement the full robust runner lifecycle in `useJobRunner.ts`:
- Import `toServerPayload` from `../store/pipelineDocument`.
- Import `validateGraph, updatePipeline, buildPipeline, executePipeline, getJob, getJobOutputs, cancelJob` from `../api/client`.
- State: `jobId`, `isStopping`, `cancelledRef`.
- Polling via TanStack `useQuery`:
  - `['job', jobId]`: refetches every 3s until `done`, `error`, or `cancelled`.
  - `['job-outputs', jobId]`: refetches every 2s until terminal.
- Supabase Realtime CDC subscription on `job_outputs` filtered by `jobId`.
- Run mutation: validate -> draft/update -> build -> execute -> store updates.
- Stop handler (`onStop`):
  ```typescript
  const onStop = useCallback(async () => {
    if (!isRunning) return
    setIsStopping(true)
    cancelledRef.current = true
    if (jobId) {
      try {
        await cancelJob(jobId)
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: 'Exécution interrompue' }])
      } catch {
        useAppStore.getState().appendConsoleLines([{ k: 'sys', t: "Échec de l'annulation côté serveur" }])
      }
    }
    runMutation.reset()
    setJobId(null)
  }, [isRunning, jobId, runMutation])
  ```
- Return `{ onRun, onStop, onClear, isPending: isRunning, isStopping, isError: runMutation.isError, jobId, status }`.

- [ ] **Step 2: Re-export or forward in `useBlockRunner.ts` for safety**

In `frontend/src/hooks/useBlockRunner.ts`:
Change to forward directly to `useJobRunner`:
```typescript
import { useJobRunner } from './useJobRunner'
export const useBlockRunner = useJobRunner
```

- [ ] **Step 3: Update `EditorHeader.tsx` to consume `useJobRunner`**

In `frontend/src/components/editor/EditorHeader.tsx`:
Change import:
```typescript
import { useJobRunner } from '../../hooks/useJobRunner'
```
and call:
```typescript
const { onRun, onStop, onClear, isPending, isStopping } = useJobRunner()
```

- [ ] **Step 4: Update `JournalPanel.tsx` to auto-select running job**

In `frontend/src/components/flow/JournalPanel.tsx`:
When `lastJobId` is present and `selectedJobId === null`, or when a run starts, set `selectedJobId = lastJobId` so the panel immediately opens the live detail view (with live `consoleLines` and real-time outputs) rather than "Aucune exécution".

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm exec tsc --noEmit && pnpm test` in `frontend/`
Expected: 0 errors, 131 tests passing.

- [ ] **Step 6: Commit Task 4 changes**

```bash
git add frontend/src/hooks/useJobRunner.ts frontend/src/hooks/useBlockRunner.ts frontend/src/components/editor/EditorHeader.tsx frontend/src/components/flow/JournalPanel.tsx
git rm frontend/src/hooks/jobRunner.ts
git commit -m "feat(frontend): implement useJobRunner with server cancellation and journal live selection"
```

---

### Task 5: Block Category Color Coding (`BlockCard.tsx` & SuperBlocks)

**Files:**
- Modify: `frontend/src/utils/superblocks.ts:58-85`
- Modify: `frontend/src/components/flow/BlockCard.tsx:40-95`
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:483-498`
- Test: `frontend/src/utils/superblocks.test.ts`

**Interfaces:**
- Produces: `BlockCardInfo` containing `categoryName: string` and `categoryColor: string`
- Consumes: `catalog.categories` with `{ id, name, color }`

- [ ] **Step 1: Write failing test for category info in `superblocks.test.ts`**

In `frontend/src/utils/superblocks.test.ts`:
```typescript
describe('blockCardInfo category colors', () => {
  it('resolves category name and color for standard block', () => {
    const mockCatalog: any = {
      blocks: {
        conv2d: { cat: 'layers', segs: [{ t: 'text', v: 'Convolution' }], inputs: [], outputs: [] }
      },
      categories: [{ id: 'layers', name: 'Couches', color: '#6366F1' }],
      superblocks: []
    }
    const info = blockCardInfo(mockCatalog, 'conv2d')
    expect(info.categoryName).toBe('Couches')
    expect(info.categoryColor).toBe('#6366F1')
  })

  it('resolves category for superblock via first child or macro stage', () => {
    const mockCatalog: any = {
      blocks: {
        load_csv: { cat: 'donnees', segs: [{ t: 'text', v: 'Load CSV' }], inputs: [], outputs: [] }
      },
      categories: [{ id: 'donnees', name: 'Données', color: '#22C55E' }],
      superblocks: [
        { id: 'tabular_sb', title: 'Pipeline Tabulaire', children: ['load_csv'], macro_stage: 1 }
      ]
    }
    const info = blockCardInfo(mockCatalog, 'tabular_sb')
    expect(info.categoryName).toBe('Données')
    expect(info.categoryColor).toBe('#22C55E')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test frontend/src/utils/superblocks.test.ts`
Expected: FAIL (`categoryName` / `categoryColor` undefined on `info`)

- [ ] **Step 3: Update `blockCardInfo` in `superblocks.ts`**

In `frontend/src/utils/superblocks.ts`:
Update `BlockCardInfo`:
```typescript
export type BlockCardInfo = {
  title: string
  inputs: { name: string; dtype: string }[]
  outputs: { name: string; dtype: string }[]
  engine: string
  color: string
  categoryName: string
  categoryColor: string
  advanced: boolean
}
```
In `blockCardInfo(catalog, type)`:
- Resolve category ID:
  - If `def?.cat`: use `def.cat`.
  - Else if `sb`: find first child's category via `sb.children.map(c => catalog.blocks[c]?.cat).find(Boolean)`.
  - Fallback: `'generic'`.
- Look up category in `catalog.categories.find(c => c.id === catId)`:
  - `categoryName`: `cat?.name ?? catId`.
  - `categoryColor`: `cat?.color ?? '#888'`.
- Return `categoryName` and `categoryColor`.

- [ ] **Step 4: Update `BlockCard.tsx` badge rendering**

In `frontend/src/components/flow/BlockCard.tsx`:
Replace the `ENGINE_LABEL` Badge:
```tsx
        <Badge
          variant="outline"
          className="text-[10px] font-extrabold shrink-0 rounded-full"
          style={{ borderColor: info.categoryColor, color: info.categoryColor }}
        >
          {info.categoryName}
        </Badge>
```
and ensure the title bullet indicator uses `info.categoryColor`.

- [ ] **Step 5: Clean edge styling in `FlowCanvas.tsx`**

In `frontend/src/components/flow/FlowCanvas.tsx`:
Remove the artificial framework-engine gradient logic for edges, keeping clean, accessible edge strokes.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test frontend/src/utils/superblocks.test.ts`
Expected: PASS

- [ ] **Step 7: Commit Task 5 changes**

```bash
git add frontend/src/utils/superblocks.ts frontend/src/utils/superblocks.test.ts frontend/src/components/flow/BlockCard.tsx frontend/src/components/flow/FlowCanvas.tsx
git commit -m "feat(frontend): switch block badges and styling to category names and colors"
```

---

### Task 6: Full Verification & Final Knip Audit

**Files:**
- Audit report across frontend and backend.

- [ ] **Step 1: Run complete backend test suite**

Run: `BACKEND_TIMEOUT=1 uv run pytest backend/mlblock/tests -v`
Expected: All tests pass.

- [ ] **Step 2: Run frontend typecheck and tests**

Run: `pnpm exec tsc --noEmit && pnpm test` in `frontend/`
Expected: 0 TS errors, all tests pass.

- [ ] **Step 3: Run production frontend build**

Run: `pnpm run build` in `frontend/`
Expected: Build succeeds without error.

- [ ] **Step 4: Run Knip dead-code audit**

Run: `pnpm dlx knip --no-exit-code` in `frontend/`
Expected: 0 unused files among active application paths (only `connection.ts` and `courseWatcher.ts` listed as intentionally reserved).

- [ ] **Step 5: Final integration commit**

```bash
git commit --allow-empty -m "chore: verify end-to-end execution chain and dead code cleanup"
```
