## ADDED Requirements

### Requirement: Navigation is URL-based

The frontend SHALL use React Router for navigation, with URLs mapping to pages.

#### Scenario: Refresh restores the page
- **WHEN** user navigates to `/editor`
- **AND** refreshes the browser
- **THEN** the editor page is restored from the URL

#### Scenario: URLs map to pages
- **WHEN** the URL is `/`
- **THEN** HomePage renders
- **WHEN** the URL is `/editor`
- **THEN** EditorPage renders (or LoginPage if unauthenticated)
- **WHEN** the URL is `/login`
- **THEN** LoginPage renders
- **WHEN** the URL is `/register`
- **THEN** RegisterPage renders
- **WHEN** the URL is `/how-it-works`
- **THEN** HowItWorksPage renders
- **WHEN** the URL is `/about`
- **THEN** AboutPage renders

### Requirement: Editor route is protected

The `/editor` route SHALL redirect unauthenticated users to `/login`.

#### Scenario: Unauthenticated user visits /editor
- **WHEN** user has no session
- **AND** visits `/editor`
- **THEN** LoginPage renders

#### Scenario: Authenticated user visits /editor
- **WHEN** user has a valid session
- **AND** visits `/editor`
- **THEN** EditorPage renders

### Requirement: Store drops screen-based navigation

The store SHALL no longer hold `screen` or the `go*()` navigation actions.

#### Scenario: No go* actions in store
- **WHEN** inspecting the store
- **THEN** `screen`, `goBuild`, `goHome`, `goLogin`, `goRegister`, `goHowItWorks`, `goAbout` SHALL be absent

### Requirement: Components navigate via useNavigate

Components SHALL navigate using `useNavigate()` instead of store navigation actions.

#### Scenario: Navigation actions replaced
- **WHEN** inspecting components that previously called `go*()`
- **THEN** they SHALL use `navigate(...)` from React Router
