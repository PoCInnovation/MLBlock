# MLBlock — IDEA

> **Scratch, but for AI.** A visual, block-based web app where anyone can build, train, and run machine-learning, deep-learning, and reinforcement-learning pipelines without writing code.

---

## 1. The Idea

MLBlock turns ML experimentation into a drag-and-drop experience. Users assemble pipelines by snapping together visual blocks — neural layers, sklearn models, data loaders, RL environments — the way kids snap together Scratch blocks. Under the hood, every pipeline is a DAG that gets validated, executed locally, or compiled into a standalone Python script and dispatched to a rented GPU.

The interface abstracts away the code while keeping the logic **transparent and educational**: each block is a real, inspectable Python function; the generated script is the actual artifact, not a simulation.

## 2. Problem Statement

| Pain point | Who feels it |
|---|---|
| ML frameworks require code, and code requires setup (CUDA, venvs, dependencies) | Students, researchers, curious non-engineers |
| First models are hard: 10+ boilerplate steps before the first tensor flows | Beginners |
| Training on your own machine is slow; cloud GPUs are cheap but the tooling (SSH, containers, billing) is hostile | Hobbyists, solo devs |
| Pipelines are usually *implicit* — scattered across notebooks — hard to reason about, share, or reproduce | Everyone |
| Teaching ML needs a tool where the structure is visible, not hidden in code | Educators |

MLBlock's bet: **make the pipeline itself the product**. Structure is first-class; execution is a side effect.

## 3. Target Audience

1. **Learners & educators** — the Scratch metaphor maps 1:1 to ML concepts (a `conv2d` block *is* a conv2d layer).
2. **Prototypers** — validate an architecture in minutes, export the generated script, iterate.
3. **Researchers on a budget** — same UI, but the heavy training runs on rented Vast.ai GPUs instead of a laptop.

## 4. Core Concepts

- **Blocks** — plain Python functions (e.g. `conv2d`, `load_csv`, `train_model`). First param is the input tensor, return value is the output. Grouped into colored categories: `neural`, `models`, `data`, `data_loader`, `training`, `transforms`, `evaluation`, `visualization`.
- **Pipelines** — DAGs of blocks. Nodes carry typed ports (`in_1` → `out_1`), edges wire them together, and Kahn's topological sort guarantees execution order (cycles are rejected at save time).
- **Code generation** — every pipeline compiles to a standalone Python script that imports nothing but the block sources and `requests`, calling home with status/output/error callbacks.
- **Remote execution** — one click rents a GPU on Vast.ai, pushes the generated script over SSH, and streams results back to the UI.

## 5. What Exists Today (v0.1)

- **~70 auto-discovered blocks** across 8 categories — a `blocks/**` scan introspects signatures at import time and feeds both the API catalog and the execution engine (no manual registration).
- **Full CRUD on pipelines** — persisted as JSON nodes/edges in PostgreSQL (Supabase), validated on write.
- **Local build & run** — the `/build` endpoint executes the DAG for real (dummy tensors for root nodes) and reports layer count + output shape.
- **Generated code** — `POST /pipelines/{id}/generate` returns a standalone script with HTTP callbacks.
- **Vast.ai dispatch** — launch, execute, destroy lifecycle, with a dev-mode mock so the whole flow works without real GPUs.
- **Supabase auth** — login/register, JWT-gated pipelines, Google OAuth ready to enable.
- **CSV upload** — file params upload to Supabase Storage and are cleaned up when jobs finish.
- **Frontend** — Scratch-inspired editor (hat block, palette, drop-bands, console panel) on a warm design-token theme.

## 6. How It Works (under the hood)

```
┌─ user ──────────────┐     ┌─ backend ───────────────────────────────┐     ┌─ GPU ──────────┐
│ drag blocks         │     │ /api/catalog  (introspected at import)  │     │ generated      │
│ wire ports          │ ──▶ │ /api/pipelines (DAG → JSON → Postgres)  │ ──▶ │ script runs    │
│ hit Run             │     │ /api/pipelines/{id}/build|execute       │     │ status/output  │
└─────────────────────┘     └─────────────────────────────────────────┘     │ callbacks home │
                                 ▲              │                            └────────────────┘
                                 └──── 60s auto-destroy dev timeout ─────────┘
```

Key insight: **the block library is the contract.** Because blocks are plain functions with a documented signature convention, adding a new block is a one-file change that lights up everywhere — palette, catalog, execution, and codegen.

## 7. Differentiators

- **Real code, not a sandbox** — generated scripts are genuinely runnable artifacts; the block functions are literally embedded in them.
- **GPU as an afterthought** — the same pipeline runs locally or on rented hardware with zero config changes.
- **Self-documenting structure** — a pipeline *is* the model architecture, visible at a glance.
- **Zero boilerplate for contributors** — the discovery bridge means no registry bookkeeping.

## 8. Roadmap

### Near term (current branch work)
- [ ] Nested control blocks (loops/conditions with `children` — API already accepts them)
- [ ] "Generate code" button in the editor header (API exists, UI doesn't)
- [ ] Editable pipeline name (hardcoded `mon-premier-modèle` today)
- [ ] Retry button on the "editor unavailable" modal
- [ ] Real Supabase config: SITE_URL, redirect URLs, Google OAuth

### Mid term
- [ ] Real GPU execution end-to-end (today: mocked locally, 60s dev timeout)
- [ ] Job history UI + results dashboard (tables exist, UI doesn't)
- [ ] Training metrics streaming (loss curves from `train_epoch` callbacks)
- [ ] Pipeline sharing / templates gallery

### Long term
- [ ] Collaborative editing
- [ ] Auto-suggested architectures from a dataset (block-level AutoML)
- [ ] Deployment of trained models as live inference endpoints
- [ ] RL environment playground with live render

## 9. Success Metrics

- Pipelines built per user per session
- Time from signup to first successful training run (< 5 min is the target)
- Share of runs that happen on remote GPUs vs. local
- Generated-code adoption (users who export and run the script standalone)

## 10. Risks & Open Questions

- **GPU economics** — Vast.ai is cheap but billing surprises kill trust. Consider credits or pre-paid quotas.
- **Abstraction ceiling** — some blocks (custom loss functions, exotic architectures) resist the block metaphor. Where is the escape hatch? (A "custom code" block is the obvious answer.)
- **Cold starts on Render free tier** — 60–90s wake-up times on first requests; mitigations exist but this constrains UX.
- **Block taxonomy drift** — as the library grows, folder naming (`{category}_{hexColor}`) and param conventions need governance.
- **Multi-output blocks** — the engine supports them, the current frontend script model mostly assumes single-output chains.

## 11. Status

Early PoC, actively developed on `dev/chedli`. Backend: FastAPI + SQLModel + PyTorch/sklearn/gymnasium, 58-test pytest suite. Frontend: React 18 + Vite + Zustand. Deployed on Render (backend API + static frontend). See [AGENTS.md](./AGENTS.md) for architecture details and [TODO.md](./TODO.md) for the live task list.
