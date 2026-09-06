## MODIFIED Requirements

### Requirement: Single package manager
The frontend SHALL be installable and buildable with exactly one package manager (pnpm), and exactly one lockfile (`pnpm-lock.yaml`) MUST be tracked in the repository.

#### Scenario: Clean install
- **WHEN** a contributor runs `pnpm install` in `frontend/`
- **THEN** dependencies resolve from `pnpm-lock.yaml` without warnings about missing or conflicting lockfiles

#### Scenario: Lockfile audit
- **WHEN** the repository tree is inspected
- **THEN** exactly one frontend lockfile is present: `pnpm-lock.yaml`

### Requirement: Tooling documentation
Project documentation MUST state that pnpm is the only supported package manager.

#### Scenario: New contributor reads tooling docs
- **WHEN** the repository guidelines describe frontend tooling
- **THEN** they specify pnpm-only and state that non-pnpm lockfiles must not be added

### Requirement: No dependency changes
This change MUST NOT alter dependency versions or runtime behavior.

#### Scenario: Build after unification
- **WHEN** `pnpm install` and `pnpm run build` run after removing the extra lockfile
- **THEN** the build succeeds with the same dependency versions as before
