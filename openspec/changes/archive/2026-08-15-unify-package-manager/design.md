## Context

See proposal.md — Why. Current state: `frontend/` tracks both `package-lock.json` (npm, lockfileVersion 3) and `bun.lock` (53 kB). AGENTS.md documents npm-only commands (`npm install`, `npm run dev`, `npm run build`); backend tooling is uv (separate).

## Goals / Non-Goals

**Goals:**
- Exactly one frontend lockfile: `package-lock.json`
- Documentation states npm-only
- Zero dependency version changes

**Non-Goals:**
- Migrating to bun/pnpm/yarn
- Rebuilding the lockfile beyond `npm install` consistency
- Touching backend tooling

## Decisions

**Keep npm, delete `bun.lock`.** npm is the documented and CI-implied manager (AGENTS.md, Render build). Bun has no committed usage.

**Update `AGENTS.md`** frontend tooling note: state npm is the only supported package manager and non-npm lockfiles must not be added.

**Verify lockfile freshness** by running `npm install` (dry/no-op expected) and `npm run build`; confirm `package-lock.json` unchanged (or minimally synced) after install.

## Risks / Trade-offs

- A contributor using bun must switch to npm; documented in AGENTS.md.
- `bun.lock` was recently touched (2h before audit) — but no bun-specific config or CI references it; deletion is safe. If a bun user surfaces later, they can regenerate.
