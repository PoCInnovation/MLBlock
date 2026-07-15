## ADDED Requirements

### Requirement: List jobs for a pipeline

The server MUST return all jobs associated with a pipeline, ordered by `created_at` descending. Only the pipeline's owner can list its jobs.

#### Scenario: Owner lists pipeline jobs
- **WHEN** `GET /api/pipelines/{id}/jobs` is called by the pipeline's owner
- **THEN** a list of job objects is returned with `id`, `status`, `created_at`, `started_at`, `completed_at` for each job

#### Scenario: Pipeline has no jobs
- **WHEN** the pipeline has never been executed
- **THEN** an empty list is returned

#### Scenario: Non-owner requests job list
- **WHEN** `GET /api/pipelines/{id}/jobs` is called by a non-owner
- **THEN** a `404 Not Found` is returned

### Requirement: Get job detail

The server MUST return a single job's full detail including output and error fields.

#### Scenario: Owner requests their job
- **WHEN** `GET /api/jobs/{job_id}` is called by the job's owner
- **THEN** a job object is returned with `id`, `pipeline_id`, `status`, `output`, `error`, `vast_instance_id`, `created_at`, `started_at`, `completed_at`

#### Scenario: Job does not exist
- **WHEN** `GET /api/jobs/{job_id}` references a non-existent ID
- **THEN** a `404 Not Found` is returned

#### Scenario: Non-owner requests a job
- **WHEN** `GET /api/jobs/{job_id}` is called by a non-owner
- **THEN** a `404 Not Found` is returned
