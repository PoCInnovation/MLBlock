---
title: 'Add ESLint, Ruff and CI (pytest + vitest)'
type: 'chore'
created: '2026-08-18'
status: 'in-review'
review_loop_iteration: 0
baseline_commit: 'a9f8e0b6306df624267e7e327d33884307c893ee'
context: []
---

## Intent

**Problem:** The repo has no linters (AGENTS.md: "No lint command exists for either stack — no eslint/prettier/ruff configured") and no CI test workflow (only `.github/workflows/release-drafter.yml`, main-only). Nothing catches type/logic regressions after `npm run build` locally.

**Approach:** Add quality gates: ESLint (flat config, typescript-eslint + react-hooks) for the frontend, Ruff for the backend, and a GitHub Actions CI workflow that runs pytest + vitest (+ lint + build) on push/PR. All three pass on the current codebase before shipping.

## Boundaries & Constraints

**Always:** ESLint 9 flat config (`eslint.config.js`, typescript-eslint recommended + react-hooks — NOT type-checked presets, the codebase was never linted). Ruff via `uv add --dev ruff` + `[tool.ruff]` in pyproject (select E, F only — correctness; line-length 120 matching existing code; no I/UP format churn). CI: `.github/workflows/ci.yml` with two jobs (backend: setup-uv → `uv sync` → `ruff check` → `pytest`; frontend: node → `npm ci` → `build` → `test` → `lint`). Lint must NOT be added to `npm run build` (local build stays fast; CI is the gate). New npm script `lint` + devDependencies. All commands must pass on the current tree — the implementer fixes lint findings (prefer real fixes; targeted rule disables only for documented repo-justified patterns, e.g. existing conventions).

**Ask First:** (1) CI pytest against the real Supabase DB needs GitHub secrets `DATABASE_URL`/`SUPABASE_URL`/`SUPABASE_SECRET_KEY` — the user must add them to the repo; without them conftest skips all DB tests (existing behavior). Design the job so it runs with or without secrets. (2) 7 pre-existing pytest failures (404s on block/category/auth routes) will make CI red — fix them if the root cause is trivial (stale route paths), else mark xfail with a comment naming the bug. Confirm which at the checkpoint.

**Never:** No Prettier (format churn on an unlinted codebase). No strict-type-checked eslint preset. No lint inside `npm run build`/`uv sync` gates. No coverage thresholds (none configured today). No changes to test logic beyond fixing the 7 pre-existing failures. Don't touch render.yaml.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lint frontend | `npm run lint` on current tree | Exits 0, no errors | Findings fixed or rule disabled with comment |
| Lint backend | `uv run ruff check .` | Exits 0, no errors | Findings fixed or rule disabled with comment |
| CI frontend job | push/PR | npm ci + build + vitest + eslint all pass | Failing step fails the job |
| CI backend job, secrets set | push/PR, DATABASE_URL + Supabase keys present | pytest runs real DB tests + ruff passes | DB unreachable → clear job failure |
| CI backend job, no secrets | push/PR, secrets absent | ruff passes; pytest skips (conftest) — job green | Documented skip, no false red |
| Pre-existing failures | 7 pytest tests (block/category/auth 404) | Fixed if trivial, else xfail with reason | Never silently dropped |

## Code Map

- `frontend/package.json` -- scripts: add `"lint": "eslint ."`; devDeps: `eslint@^9`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`. TypeScript 6.0.3 — verify typescript-eslint supports it at install time.
- `frontend/eslint.config.js` -- NEW flat config: `tseslint.configs.recommended` + `reactHooks.configs.flat.recommended` + `reactRefresh` + `ignores: ['dist', 'node_modules']`; languageOptions parserOptions projectService NOT enabled (no type-checked rules).
- `backend/pyproject.toml` -- `uv add --dev ruff`; add `[tool.ruff]`: `line-length = 120`, `target-version = "py310"`, `[tool.ruff.lint] select = ["E", "F"]` (pycodestyle errors + pyflakes bugs; skip isort/upgrade to avoid churn).
- `.github/workflows/ci.yml` -- NEW: `on: [push, pull_request]` (all branches). Jobs:
  - `backend`: ubuntu-latest → `astral-sh/setup-uv@v5` (cache) → `uv sync --dev` → `uv run ruff check .` → `uv run pytest mlblock/tests -q` with `env: DATABASE_URL/SUPABASE_URL/SUPABASE_SECRET_KEY` from `secrets` (empty strings when absent → conftest skips).
  - `frontend`: ubuntu-latest → `actions/setup-node@v4` node 20, cache npm → `npm ci` → `npm run build` → `npm test` → `npm run lint`.
- `backend/mlblock/tests/` -- 7 pre-existing failures (test_server/test_auth 404s); root-cause check: stale route paths in tests vs `routes.py` — fix in place or xfail with comment.
- `frontend/vite.config.ts` -- no `test` block today; vitest runs with defaults in CI (`npm test` = `vitest run`) — leave unchanged.

## Tasks & Acceptance

**Execution:**
- [x] `frontend/package.json` -- add eslint devDeps + `lint` script -- flat-config toolchain for React+TS
- [x] `frontend/eslint.config.js` -- NEW recommended flat config (no type-checked presets) -- lint passes on current tree
- [x] `frontend/src/**` -- fix eslint findings (real fixes; documented rule disables only) -- `npm run lint` exits 0
- [x] `backend/pyproject.toml` -- `uv add --dev ruff` + `[tool.ruff]` (E,F, line-length 120) -- lint passes on current tree
- [x] `backend/mlblock/**` -- fix ruff findings -- `uv run ruff check .` exits 0
- [x] `.github/workflows/ci.yml` -- NEW two-job workflow (pytest+ruff / build+vitest+eslint) -- runs on push/PR
- [x] `backend/mlblock/tests/` -- fix or xfail the 7 pre-existing failures -- CI pytest green (or documented skip)

**Acceptance Criteria:**
- Given the current frontend tree, when `npm run lint` runs, then it exits 0 with no errors.
- Given the current backend tree, when `uv run ruff check .` runs, then it exits 0 with no errors.
- Given the current frontend tree, when `npm run build && npm test` runs, then both pass (no regression).
- Given the CI workflow file, when inspected, then it contains backend (ruff+pytest) and frontend (build+vitest+eslint) jobs triggered on push and pull_request.
- Given the CI backend job without GitHub secrets, when it runs, then ruff passes and pytest skips DB tests (conftest) without failing the job.
- Given the CI backend job with GitHub secrets set, when it runs, then pytest executes the real DB suite and passes (7 pre-existing failures resolved or xfail'd).
- Given `npm run build`, when run locally, then it does NOT invoke eslint (build stays fast).

## Spec Change Log

## Design Notes

- Two lint passes with different philosophies: eslint recommended (no type-checked: `parserOptions.project` off — a never-linted codebase would drown in type-aware findings) and ruff E,F only (correctness; skipping I/UP keeps the diff small and respects existing import style).
- CI design keeps the existing conftest skip contract: absent `DATABASE_URL` → skip, present → run. The workflow passes `secrets.*` with empty fallbacks so the job is green in both modes and real once the user adds secrets.
- Fixing the 7 pre-existing 404s is in-scope only because "CI pytest green" is an acceptance criterion; the alternative (xfail with comment) is the escape hatch if the root cause is nontrivial.

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0
- `npm run build && npm test` -- expected: pass (existing 53 vitest tests)
- `uv run ruff check .` -- expected: exit 0
- `uv run pytest mlblock/tests -q` -- expected: green (or documented xfail/skip)
- `uv run --locked` (or `uv sync`) -- expected: resolves with ruff added

**Manual checks (no CLI):**
- Inspect `.github/workflows/ci.yml` renders valid YAML (no local actionlint available; visual check).
- GitHub repo → Actions tab shows the workflow after push (user verifies; no push by this workflow).
