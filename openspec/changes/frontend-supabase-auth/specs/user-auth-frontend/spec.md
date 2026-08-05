## ADDED Requirements

### Requirement: Login page with email/password

The system SHALL provide a login page accessible from the navigation.

#### Scenario: Successful email/password login
- **WHEN** user navigates to `/login`
- **AND** enters valid email and password
- **THEN** user is authenticated
- **AND** redirected to the editor (`screen: 'build'`)

#### Scenario: Failed login shows error
- **WHEN** user enters invalid credentials
- **THEN** an error message is displayed
- **AND** user stays on the login page

### Requirement: Login page with magic link

The system SHALL provide a "magic link" login option on the login page.

#### Scenario: Magic link sent
- **WHEN** user clicks "Magic link" button
- **AND** enters their email
- **THEN** Supabase sends a magic link email
- **AND** a confirmation message is shown

### Requirement: Login page with Google OAuth

The system SHALL provide a "Sign in with Google" button on the login page.

#### Scenario: Google OAuth login
- **WHEN** user clicks "Sign in with Google"
- **THEN** Supabase redirects to Google OAuth
- **AND** after successful auth, user is redirected back to the editor

### Requirement: Register page

The system SHALL provide a registration page with email, password, and password confirmation.

#### Scenario: Successful registration
- **WHEN** user navigates to `/register`
- **AND** fills email, password, and confirmation
- **AND** password matches confirmation
- **THEN** Supabase creates the user
- **AND** user is logged in automatically
- **AND** redirected to the editor

#### Scenario: Password mismatch
- **WHEN** password and confirmation don't match
- **THEN** an error message is shown
- **AND** registration is not submitted

### Requirement: Axios interceptor injects Bearer token

The system SHALL attach the Supabase session access token to every API request.

#### Scenario: Token attached on authenticated requests
- **WHEN** any API call is made via `http` (axios instance)
- **AND** a valid Supabase session exists
- **THEN** the `Authorization: Bearer <token>` header is set

#### Scenario: No token on unauthenticated requests
- **WHEN** no session exists
- **THEN** no `Authorization` header is added

### Requirement: Editor page is protected

The editor page SHALL redirect unauthenticated users to login.

#### Scenario: Authenticated user accesses editor
- **WHEN** user has a valid Supabase session
- **AND** navigates to the editor
- **THEN** the editor loads normally

#### Scenario: Unauthenticated user accesses editor
- **WHEN** user has no session
- **AND** tries to access the editor
- **THEN** user is redirected to the login page

### Requirement: Logout

The system SHALL allow the user to log out from the editor.

#### Scenario: Logout clears session
- **WHEN** authenticated user clicks "Logout"
- **THEN** Supabase session is cleared
- **AND** user is redirected to the home page
