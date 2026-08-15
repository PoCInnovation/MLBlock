## Purpose

Frontend visual quality bar: readable text sizing, token-only styling, balanced landing layout, and touch-accessible form feedback — the non-accessibility findings of the UI/UX audit.

## ADDED Requirements

### Requirement: Minimum UI text size
Interactive UI text (labels, metadata, button captions, console rows) MUST be at least 12px. No production-facing text may render below 12px.

#### Scenario: Small metadata text
- **WHEN** a parameter label, file metadata, card meta, or dropdown shortcut is rendered
- **THEN** its font size is ≥12px

#### Scenario: Tiny controls
- **WHEN** a 10–11px control (e.g. file `removeBtn`, card footer, dropdown labels) is displayed
- **THEN** it is bumped to ≥12px (or removed if decorative)

### Requirement: Token-only styling
Component styles MUST use design tokens (`theme.ts` / Tailwind `@theme` variables) instead of ad-hoc hex/rgba literals that duplicate a token. Visual surfaces, borders, and text colors must not diverge from the token system.

#### Scenario: Token drift check
- **WHEN** a component defines an inline color (rgba/hex) that matches an existing token value
- **THEN** it references the token instead of the literal

### Requirement: Balanced landing layout
The landing page MUST be visually balanced: hero content vertically centered against its illustration, footer content padded, section spacing following a consistent rhythm, and card internals (icons, radii) consistent across sections.

#### Scenario: Hero alignment
- **WHEN** the landing hero renders at desktop width
- **THEN** the text column and the code-block illustration are vertically centered relative to each other

#### Scenario: Card consistency
- **WHEN** feature cards and the hero code-card render side by side
- **THEN** their border radii and icon placement follow the same values

### Requirement: Visible inline validation errors
Parameter validation errors MUST be visible inline near the field (not only in a `title` tooltip) so they are accessible without hover and on touch devices.

#### Scenario: Invalid parameter value
- **WHEN** a user enters an invalid parameter value
- **THEN** an inline error message appears next to the field in addition to the existing border highlight

#### Scenario: No hover required
- **WHEN** a validation error is present on a touch device
- **THEN** the error text is visible without hovering
