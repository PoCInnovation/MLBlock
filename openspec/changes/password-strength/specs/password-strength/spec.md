## ADDED Requirements

### Requirement: Register requires password complexity

The register form SHALL require a password with at least 6 characters, one uppercase, one lowercase, and one digit.

#### Scenario: Weak password rejected
- **WHEN** user submits register with `abc` (3 chars, no uppercase, no digit)
- **THEN** the form is invalid
- **AND** Zod shows the relevant error(s)

#### Scenario: Strong password accepted
- **WHEN** user submits register with `Passw0rd`
- **THEN** the password passes the complexity rules

### Requirement: Login does not require complexity

The login form SHALL only require a minimum of 6 characters for the password.

#### Scenario: Old weak password logs in
- **WHEN** a user with an existing weak password (e.g., `abcdef`) logs in
- **THEN** the login is not blocked by the new complexity rules

### Requirement: Password checklist is real-time

The register form SHALL show a live checklist of the 4 password rules that updates as the user types.

#### Scenario: Rules tick as password grows
- **WHEN** user types `P`
- **THEN** "Une majuscule" is checked, others unchecked
- **WHEN** user types `Password9`
- **THEN** all 4 rules are checked

### Requirement: Confirmation still validated

The register form SHALL still require the confirmation to match the password.

#### Scenario: Mismatch rejected
- **WHEN** password and confirm differ
- **THEN** "Les mots de passe ne correspondent pas" is shown
