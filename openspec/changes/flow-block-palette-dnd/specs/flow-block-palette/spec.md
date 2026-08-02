## ADDED Requirements

### Requirement: Block palette by category

The advanced mode SHALL display a sidebar listing blocks grouped by category, using the already-loaded catalog.

#### Scenario: Palette renders with categories
- **WHEN** the advanced mode is active
- **THEN** a palette sidebar is visible
- **AND** blocks are grouped by category
- **AND** each category uses its backend color

#### Scenario: Palette uses existing theme
- **WHEN** the palette renders
- **THEN** it SHALL use the app theme tokens (`theme.ts`)
- **AND** no hardcoded hex colors

### Requirement: Drag from palette to canvas

The system SHALL allow dragging a block from the palette onto the React Flow canvas.

#### Scenario: Drag starts on palette item
- **WHEN** user starts dragging a palette item
- **THEN** the block type is stored in the drag data
- **AND** the item shows `cursor: grab`

#### Scenario: Drop creates a node
- **WHEN** user drops the palette item on the canvas
- **THEN** a new React Flow node is created at the drop position
- **AND** the node has the block type, label, category, and params from the catalog
- **AND** the node is added to `flowNodes`

#### Scenario: Drop outside canvas does nothing
- **WHEN** user drops the item outside the canvas
- **THEN** no node is created

### Requirement: Node initialization

The new node SHALL be initialized with the block's default parameters.

#### Scenario: Node has block params
- **WHEN** a node is created from the palette
- **THEN** its `data.params` matches the block's default params from the catalog
- **AND** it can be connected to other nodes via handles

### Requirement: Hover feedback on palette items

Palette items SHALL provide hover feedback.

#### Scenario: Hover on palette item
- **WHEN** user hovers over a palette item
- **THEN** a subtle visual change occurs (background or border)
- **AND** the transition is 150-300ms
