## ADDED Requirements

### Requirement: GPU Callback Security
The system SHALL secure all GPU callback routes (`/jobs/{job_id}/status`, `/jobs/{job_id}/output`, `/jobs/{job_id}/error`) using the `GPU_API_KEY` API key.

#### Scenario: Valid GPU callback authorization
- **WHEN** the GPU makes a request to a callback route with header `Authorization: Bearer <GPU_API_KEY>`
- **THEN** the system SHALL authorize the request and update the database accordingly

#### Scenario: Invalid GPU callback authorization
- **WHEN** the GPU makes a request with an incorrect or missing key
- **THEN** the system SHALL return an HTTP 403 Forbidden status

### Requirement: Automatic Instance Destruction
The system SHALL destroy the Vast.ai instance automatically when the job completes or fails.

#### Scenario: Destroy instance on successful completion
- **WHEN** the GPU callback notifies status `done`
- **THEN** the system SHALL mark the job as `done` and call Vast.ai APIs to delete the computation instance

#### Scenario: Destroy instance on run error
- **WHEN** the GPU callback notifies status `error` or calls the error endpoint
- **THEN** the system SHALL mark the job as `error` and call Vast.ai APIs to delete the computation instance
