## Purpose

Every REST response consumed by the frontend is validated against a zod schema at the fetch boundary, so contract drift fails loudly instead of corrupting UI state.

## ADDED Requirements

### Requirement: Schema-validated API responses
Every response payload returned by the API client's data-fetching functions must be validated against a declared zod schema before it is returned to callers. Payloads that fail validation must surface a descriptive error naming the mismatch instead of being silently returned.

#### Scenario: Catalog payload valid
- **WHEN** the server returns a catalog payload matching the catalog schema
- **THEN** the parsed catalog is returned to the caller unchanged

#### Scenario: Job payload malformed
- **WHEN** the server returns a job payload missing a required field
- **THEN** the fetch fails with a descriptive validation error, and no partial job object reaches the UI

#### Scenario: Unknown extra fields
- **WHEN** the server returns a payload with extra fields not declared in the schema
- **THEN** the extra fields are stripped and the validated payload is returned (non-breaking by default)

### Requirement: Schema coverage of pipeline and job types
Schemas must cover pipeline list/detail/create payloads, job, job outputs, build and code-generation responses.

#### Scenario: Every fetch function validated
- **WHEN** each API client data-fetching function is exercised against its schema
- **THEN** a schema exists for its response type and is applied at the boundary

### Requirement: Schema and type parity
The runtime schemas and the TypeScript types describing the same payload must agree on shape.

#### Scenario: Type drift check
- **WHEN** a TypeScript type and its zod schema describe the same payload
- **THEN** both accept and reject the same payloads (types derived from schemas where practical)
