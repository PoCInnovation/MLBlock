## ADDED Requirements

### Requirement: JWT verification on protected routes

The server MUST verify Supabase JWTs on all pipeline and job routes. Unauthenticated requests MUST receive `401 Unauthorized`.

#### Scenario: Valid JWT
- **WHEN** a request includes `Authorization: Bearer <valid-supabase-jwt>`
- **THEN** the JWT is decoded, `sub` claim is extracted as `user_id`, and the request proceeds

#### Scenario: Missing Authorization header
- **WHEN** a request to a protected route has no `Authorization` header
- **THEN** a `401 Unauthorized` response is returned with `{"detail": "Missing authentication token"}`

#### Scenario: Expired JWT
- **WHEN** the JWT has expired
- **THEN** a `401 Unauthorized` response is returned with `{"detail": "Token has expired"}`

#### Scenario: Invalid JWT signature
- **WHEN** the JWT signature does not match the Supabase JWT secret
- **THEN** a `401 Unauthorized` response is returned with `{"detail": "Invalid token"}`

### Requirement: User ID injection

The server MUST make the authenticated user's ID available to route handlers via FastAPI dependency injection.

#### Scenario: Route handler accesses user ID
- **WHEN** a protected route handler needs the current user
- **THEN** it calls `current_user_id = Depends(get_current_user)` which returns the `user_id` string extracted from the JWT

### Requirement: Public routes remain unprotected

The blocks routes (`GET /api/blocks`, `GET /api/blocks/categories`, `GET /api/blocks/{type_name}`) MUST NOT require authentication.

#### Scenario: Unauthenticated block listing
- **WHEN** `GET /api/blocks` is called without an Authorization header
- **THEN** the full block list is returned (same as with auth)
