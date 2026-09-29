<!-- bmad:context -->
<!-- Verified 2026-09-27 against 352e9f4eb413fd9f46dc89058735a6d6ecbf439c. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## mlblock

Visual no-code DAG builder for ML/DL/RL prototyping ("Scratch for ML"). Independent backend (FastAPI, SQLModel, PyTorch) and frontend (React 19, Vite, TanStack Router/Start, ReactFlow). Planning and ADRs live in `docs/adr/`, task roadmap in `todo.md`, domain glossary in `CONTEXT.md`.

## Policy

- Use `uv` exclusively in `backend/` — never use `pip` or create manual virtualenvs.
- Use `pnpm@9.15.4` exclusively in `frontend/` — never use `npm`, `yarn`, or `bun`.
- Never edit or commit `backend/main.py` — it is a codegen artifact overwritten on run.
- Never bypass `store/useAppStore.ts` — `flowNodes` and `flowEdges` are the single source of truth on the canvas.
- Never push directly to `main` — all changes go through feature/spec branches and pull requests.
- Vocabulary is strictly enforced per `CONTEXT.md`: use Block / Catalog / Pipeline / Job (never Bloc, Registry, Graph, Run, or Task).

## Where things are

- Entry points: FastAPI app at `backend/mlblock/server/main.py`, React shell at `frontend/src/main.tsx`.
- Pipeline conversion & undo: pure converters in `frontend/src/store/pipelineDocument.ts`.
- Block catalog discovery & registry facade: `backend/mlblock/blocks/registry.py` and `backend/mlblock/catalog.py`.
- Validation & Kahn DAG sort: `backend/mlblock/validation.py`.
- Standalone Python code generator: `backend/mlblock/core/generator.py`.
- Agent specs & skills: `docs/agents/domain.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`.

## Running and verifying

- Backend install and lint: `uv sync --dev` then `uv run ruff check .` in `backend/`.
- Backend tests: `uv run pytest mlblock/tests -q`. Unit tests (`test_validation.py`, `test_types.py`, `test_pipeline.py`) run in-memory without secrets; tests requiring live Supabase Postgres skip cleanly when `DATABASE_URL` is empty. Never assume a SQLite fallback exists.
- Frontend install: `pnpm install --frozen-lockfile` in `frontend/`.
- Frontend build & check: `pnpm run build` (runs `tsc --noEmit` and SSG prerender; requires placeholder `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- Frontend lint & test: `pnpm exec eslint . --max-warnings 0` and `pnpm test`.
- Local execution switch: `MLBLOCK_RUN_MODE=local` (Popen subprocess) vs `gpu` (Vast.ai REST). Setting `VAST_API_KEY=mock-*` forces local execution.
- Supabase connection: `DATABASE_URL` must point to Supabase pooler on port `:6543` in transaction mode with percent-encoded special characters in password (`?` -> `%3F`, `@` -> `%40`, `*` -> `%2A`).

## Conventions that differ from defaults

- Code style: clean, simple, and efficient code; favor short, focused functions and delete dead abstractions.
- Backend blocks: pure functions with `from __future__ import annotations`, no base classes. Data ports must use `in_` prefix with string annotations (`in_1: "Tensor"`). Heavy dependencies (`torch`, `pandas`) must be imported inside the function body for instant catalog discovery.
- Block docstrings: Line 1 label (FR), Line 2 summary (FR), parameter constraints formatted as `(entre: min-max, pas: x)`, `(choix: a|b)`, `(format: .csv)`.
- Handlers in `routes.py`: synchronous `def` with sync SQLModel sessions and dependency injection (`Depends(get_session)`).
- Edge classification symmetry: verdicts are computed symmetrically by `backend/mlblock/core/types.py:classify` and `frontend/src/utils/typeCheck.ts:classifyEdge`.
- Canvas behavior: free-form drag without grid snapping. Styling uses Astryx + StyleX + Tailwind v4 with enforced `data-theme="dark"`.

## Known pitfalls

- `BlockRegistry` is process-global in backend: custom block registrations in tests will leak across test cases if not cleaned up.
- Frontend API payload loss: all ReactFlow to server conversions must pass through `pipelineDocument.toServerPayload`; direct serialization drops child node hierarchies.
- Paused free-tier Supabase: causes silent database pool timeouts while authentication appears healthy.

<!-- /bmad:context -->
