## ADDED Requirements

### Requirement: Ephemeral GPU computation
The system SHALL launch an instance on Vast.ai, run the generated Python script with on-the-fly dependencies, and return the job information.

#### Scenario: Successful execution launch
- **WHEN** a user triggers the `POST /pipelines/{id}/execute` route
- **THEN** the system SHALL launch a Vast.ai instance with image `ghcr.io/astral-sh/uv:python3.13-bookworm`, create a job record with status `queued`, sleep to let it boot, and execute the base64-encoded Python script using `uv run`

#### Scenario: Inject environment variables
- **WHEN** the system executes the command on the Vast.ai instance
- **THEN** the system SHALL inject the environment variables `BACKEND_URL`, `GPU_API_KEY`, and `JOB_ID` in the SSH command pipeline
