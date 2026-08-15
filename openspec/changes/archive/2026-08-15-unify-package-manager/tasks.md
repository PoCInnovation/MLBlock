## 1. Unify

- [x] 1.1 Delete `frontend/bun.lock`
- [x] 1.2 Run `npm install` in `frontend/` and confirm `package-lock.json` is consistent (unchanged or minimally synced)
- [x] 1.3 `AGENTS.md`: state npm is the only supported frontend package manager and non-npm lockfiles must not be added

## 2. Verify

- [x] 2.1 `npm run build` passes with the same dependency versions as before
- [x] 2.2 Repository tree shows exactly one frontend lockfile: `package-lock.json`
