## ADDED Requirements

### Requirement: User JWT validation
The system SHALL require all user-facing endpoints to validate the Supabase Auth JWT passed via the `Authorization: Bearer <jwt>` header.

#### Scenario: Valid authentication token
- **WHEN** a client sends a request to a protected endpoint with a valid Supabase JWT
- **THEN** the system SHALL decode the token, verify its signature using `SUPABASE_JWT_SECRET`, and allow the request to proceed, injecting the `sub` claim as the user's UUID

#### Scenario: Expired authentication token
- **WHEN** a client sends a request with an expired JWT
- **THEN** the system SHALL return an HTTP 401 Unauthorized status with a detailed error message "Token has expired"

#### Scenario: Invalid authentication token
- **WHEN** a client sends a request with an malformed or invalid signature JWT
- **THEN** the system SHALL return an HTTP 401 Unauthorized status with a detailed error message "Invalid token"
