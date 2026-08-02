## ADDED Requirements

### Requirement: Search input filters blocks

The palette SHALL provide a text input that filters blocks by label in real time.

#### Scenario: Search matches block name
- **WHEN** user types "conv" in the search input
- **THEN** only blocks whose label contains "conv" are displayed
- **AND** the filter is case-insensitive

#### Scenario: Empty search shows all
- **WHEN** the search input is empty
- **THEN** all blocks are displayed (subject to category filter)

### Requirement: Category chips filter blocks

The palette SHALL provide clickable category chips to filter blocks by category.

#### Scenario: Category chip filters blocks
- **WHEN** user clicks the "neural" chip
- **THEN** only blocks in the neural category are displayed

#### Scenario: All chip shows everything
- **WHEN** user clicks the "Tous" chip
- **THEN** all blocks are displayed (subject to search filter)

#### Scenario: One chip active at a time
- **WHEN** a category chip is active
- **THEN** only that chip is highlighted

### Requirement: Search and category filters combine

The search and category filters SHALL apply simultaneously.

#### Scenario: Combined filtering
- **WHEN** user selects the "neural" category
- **AND** types "conv" in the search input
- **THEN** only blocks that are both in neural AND contain "conv" are displayed

### Requirement: Filtering is local UI state

The search query and selected category SHALL live in component state, not the store.

#### Scenario: No store changes
- **WHEN** inspecting the store
- **THEN** no search or category filter fields are added
