## ADDED Requirements

### Requirement: Theme tokens are exported from a single file

The system SHALL export all design tokens from `src/theme.ts` as a single `theme` object.

#### Scenario: Tokens available to all components
- **WHEN** any component imports `from '../../theme'`
- **THEN** it SHALL have access to `theme.color`, `theme.spacing`, `theme.radius`, `theme.font`, and `theme.shadow`

### Requirement: Notch component is shared

The system SHALL provide a reusable `<Notch>` component for the block connector visual pattern.

#### Scenario: Notch renders correctly
- **WHEN** `<Notch color="#..." side="top" />` is rendered
- **THEN** it SHALL display a semi-circular notch at the specified position and side

### Requirement: Migrated components use tokens instead of hex literals

BlockSegments, LoginPage, RegisterPage, HomeNav, and EditorHeader SHALL use `theme.*` instead of hardcoded hex values.

#### Scenario: No hex literals in migrated files
- **WHEN** inspecting the migrated component files
- **THEN** there SHALL be zero hex color literals outside of the `theme.ts` file
