## Purpose

Declares and enforces Python >=3.10 runtime requirements and specifies uv as the exclusive backend package manager, virtual environment orchestrator, and runtime CLI, backed by a committed uv.lock.

## ADDED Requirements

### Requirement: Exclusive Python Environment and Package Manager
The backend system SHALL use `uv` as the sole package manager and virtual environment orchestrator for dependency resolution and runtime execution.

#### Scenario: Deterministic environment synchronization
- **WHEN** a developer or CI runner executes `uv sync` in `backend/`
- **THEN** the virtual environment is synchronized strictly against `pyproject.toml` and `uv.lock` without fallback to pip

#### Scenario: Runtime execution via uv
- **WHEN** backend processes, dev servers, tests, or CLI commands are run
- **THEN** they execute via `uv run` in the managed virtual environment

### Requirement: Prohibition of Stale Requirements Files
The repository SHALL NOT track or consume legacy `requirements.txt` files for dependency management.

#### Scenario: Repository lockfile inspection
- **WHEN** backend dependency tracking is audited
- **THEN** `uv.lock` is the sole lockfile present and any legacy `requirements.txt` is eliminated or explicitly disallowed
