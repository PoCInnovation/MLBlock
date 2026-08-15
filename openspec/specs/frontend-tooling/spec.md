# Frontend Tooling

## Purpose

Declares npm as the sole frontend package manager with a single committed lockfile, removing install ambiguity and drift risk.

## Requirements

### Requirement: Single package manager
The frontend must be installable and buildable with exactly one package manager (npm), and exactly one lockfile (`package-lock.json`) must be tracked in the repository.

#### Scenario: Clean install
- **WHEN** a contributor runs `npm install` in `frontend/`
- **THEN** dependencies resolve from `package-lock.json` without warnings about missing or conflicting lockfiles

#### Scenario: Lockfile audit
- **WHEN** the repository tree is inspected
- **THEN** exactly one frontend lockfile is present: `package-lock.json`

### Requirement: Tooling documentation
Project documentation must state that npm is the only supported package manager.

#### Scenario: New contributor reads tooling docs
- **WHEN** the repository guidelines describe frontend tooling
- **THEN** they specify npm-only and state that non-npm lockfiles must not be added

### Requirement: No dependency changes
This change must not alter dependency versions or runtime behavior.

#### Scenario: Build after unification
- **WHEN** `npm install` and `npm run build` run after removing the extra lockfile
- **THEN** the build succeeds with the same dependency versions as before
