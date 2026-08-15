## Why

`frontend/` tracks two lockfiles: `package-lock.json` (npm, 126 kB, lockfileVersion 3) and `bun.lock` (53 kB). AGENTS.md and all documented commands are npm-only ("npm only (package-lock.json; no bun/pnpm/yarn)"). The dual lockfiles invite drift between npm/bun installs and ambiguous CI behavior.

## What Changes

- Delete `frontend/bun.lock` (npm is the canonical PM; `package-lock.json` stays).
- Keep `frontend/package-lock.json` in sync with `package.json` via `npm install`.
- `AGENTS.md`: strengthen the frontend tooling note — npm is the only supported package manager; bun.lock must not be reintroduced.
- No dependency version changes; no runtime behavior change.

## Capabilities

### New Capabilities

- `frontend-tooling`: the frontend declares exactly one package manager (npm) and exactly one committed lockfile (`package-lock.json`); no other lockfile is tracked.

### Modified Capabilities
<!-- None. -->
