## ADDED Requirements

### Requirement: List user's pipelines

The server MUST return all pipelines belonging to the authenticated user, ordered by `updated_at` descending.

#### Scenario: Authenticated user lists pipelines
- **WHEN** `GET /api/pipelines` is called with a valid JWT
- **THEN** a paginated list of `PipelineSummary` objects is returned, filtered to the requesting user's pipelines only

#### Scenario: No pipelines exist
- **WHEN** the user has no saved pipelines
- **THEN** an empty list is returned with `total: 0`

### Requirement: Get pipeline by ID

The server MUST return a single pipeline's full detail (nodes, edges, metadata) when requested by its owner.

#### Scenario: Owner requests their pipeline
- **WHEN** `GET /api/pipelines/{id}` is called by the pipeline's owner
- **THEN** a `PipelineDetail` object is returned with `nodes`, `edges`, `name`, `description`, `created_at`, `updated_at`

#### Scenario: Non-owner requests a pipeline
- **WHEN** `GET /api/pipelines/{id}` is called by a user who does not own the pipeline
- **THEN** a `404 Not Found` is returned (not 403 — ownership is not leaked)

#### Scenario: Pipeline does not exist
- **WHEN** `GET /api/pipelines/{id}` references a non-existent ID
- **THEN** a `404 Not Found` is returned

### Requirement: Create pipeline

The server MUST create a new pipeline belonging to the authenticated user, validate the graph, and return the full detail.

#### Scenario: Valid pipeline creation
- **WHEN** `POST /api/pipelines` is called with `{ name, description?, nodes, edges }`
- **THEN** a pipeline is created with `user_id` set to the authenticated user, the graph is validated, and `PipelineDetail` is returned with status `201 Created`

#### Scenario: Invalid graph
- **WHEN** `POST /api/pipelines` is called with nodes/edges that fail validation
- **THEN** a `422 Unprocessable Entity` is returned with validation errors

### Requirement: Update pipeline

The server MUST update an existing pipeline's name, description, nodes, and edges. Only the owner can update.

#### Scenario: Owner updates pipeline
- **WHEN** `PUT /api/pipelines/{id}` is called by the pipeline's owner with partial or full update body
- **THEN** the pipeline is updated, `updated_at` is set to now, and `PipelineDetail` is returned

#### Scenario: Non-owner attempts update
- **WHEN** `PUT /api/pipelines/{id}` is called by a non-owner
- **THEN** a `404 Not Found` is returned

### Requirement: Delete pipeline

The server MUST delete a pipeline and all associated jobs when requested by the owner.

#### Scenario: Owner deletes pipeline
- **WHEN** `DELETE /api/pipelines/{id}` is called by the pipeline's owner
- **THEN** the pipeline and all its jobs are deleted, status `204 No Content` is returned

#### Scenario: Non-owner attempts delete
- **WHEN** `DELETE /api/pipelines/{id}` is called by a non-owner
- **THEN** a `404 Not Found` is returned
