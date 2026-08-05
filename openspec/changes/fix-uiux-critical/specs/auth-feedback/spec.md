## ADDED Requirements

### Requirement: Focus is visible for keyboard navigation

The app SHALL show a visible focus indicator for keyboard users.

#### Scenario: Tab focuses an input
- **WHEN** a keyboard user tabs to an input or button
- **THEN** a visible focus ring is displayed
- **AND** no input has `outline: 'none'` without a replacement

### Requirement: Interactive elements are keyboard accessible

Clickable controls SHALL be real buttons, not `<span>` or `<div>` with onClick.

#### Scenario: Category chips focusable
- **WHEN** a keyboard user tabs to a category chip
- **THEN** it is focusable
- **AND** activatable with Enter/Space

#### Scenario: Nav links focusable
- **WHEN** a keyboard user tabs to a nav link
- **THEN** it is focusable and activatable

### Requirement: Success messages meet contrast AA

Text shown for success/failure feedback SHALL meet a 4.5:1 contrast ratio.

#### Scenario: Success message readable
- **WHEN** "Compte créé !" or magic-link success is shown
- **THEN** the text color has at least 4.5:1 contrast against its background
