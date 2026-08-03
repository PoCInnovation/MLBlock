## ADDED Requirements

### Requirement: Console visible in advanced mode

The advanced mode (FlowCanvas) SHALL display the console panel so run feedback is visible.

#### Scenario: Run in advanced mode shows feedback
- **WHEN** user clicks Run in advanced mode
- **THEN** the console panel appears
- **AND** run feedback (validation, build, done) is visible

### Requirement: Advanced mode sends correct node types

The pipeline run in advanced mode SHALL send the node's actual type, not its display label.

#### Scenario: Run uses data.type
- **WHEN** a pipeline runs in advanced mode
- **THEN** each node's `type` is `data.type` (e.g., `conv2d`), not the French label (e.g., `Couche dense`)
- **AND** the backend receives a valid graph

### Requirement: Login shows loading state

The login form SHALL disable its button and show loading feedback during submission.

#### Scenario: Login in progress
- **WHEN** user submits login
- **THEN** the button is disabled while the request is in flight
- **AND** no double submission is possible

#### Scenario: Login network error
- **WHEN** a network error occurs during login
- **THEN** a French error message is shown
- **AND** no unhandled promise rejection occurs

### Requirement: Supabase errors are shown in French

Authentication errors SHALL be displayed in French, not raw English.

#### Scenario: Invalid credentials
- **WHEN** user enters wrong email/password
- **THEN** "Email ou mot de passe incorrect" is shown

#### Scenario: Unconfirmed email
- **WHEN** user logs in with an unconfirmed email
- **THEN** a French message explains the email must be confirmed

### Requirement: Register detects existing accounts

The register form SHALL detect when an account already exists instead of showing false success.

#### Scenario: Email already registered
- **WHEN** user registers with an existing email
- **AND** Supabase returns no user (confirmation enabled)
- **THEN** an error message is shown
- **AND** "Compte créé !" is not displayed

### Requirement: Stop message not shown after build error

The console SHALL not show "Arrêté" when a run ends due to a build error.

#### Scenario: Build fails
- **WHEN** a build fails
- **THEN** the console shows the build error
- **AND** does not append "■ Arrêté"
