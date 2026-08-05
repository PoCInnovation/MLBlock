## ADDED Requirements

### Requirement: Editor mode toggle

The editor SHALL provide a toggle button to switch between linear and advanced modes.

#### Scenario: Toggle button visible
- **WHEN** the editor loads
- **THEN** a toggle button is visible in the editor header
- **AND** the default mode is "linear"

#### Scenario: Switch to advanced mode
- **WHEN** user clicks the toggle to switch to advanced mode
- **THEN** the canvas switches to React Flow
- **AND** any existing blocks are converted to nodes with vertical layout
- **AND** the button label changes to show the current mode

#### Scenario: Switch back to linear mode
- **WHEN** user clicks the toggle to switch to linear mode
- **THEN** the canvas switches back to the linear block list
- **AND** any nodes/edges are converted back to a linear `Block[]`

### Requirement: React Flow canvas

The advanced mode SHALL render a React Flow canvas with zoom, pan, and node placement.

#### Scenario: Canvas renders
- **WHEN** advanced mode is active
- **THEN** a React Flow canvas is displayed with zoom, pan, and background

#### Scenario: Nodes are draggable
- **WHEN** user drags a node on the canvas
- **THEN** the node position is updated

#### Scenario: Nodes connect via edges
- **WHEN** user drags from a source handle to a target handle
- **THEN** a new edge is created between the two nodes

### Requirement: Custom block nodes

Each block type SHALL render as a custom React Flow node with input/output handles.

#### Scenario: Block node renders
- **WHEN** a block node is on the canvas
- **THEN** it displays the block name, parameters, and input/output handles

#### Scenario: Port connections are validated
- **WHEN** user tries to connect two handles
- **THEN** the connection is only allowed if the source is an output and target is an input

### Requirement: Bidirectional conversion

The system SHALL convert between linear and advanced representations without data loss.

#### Scenario: Linear to flow
- **WHEN** user switches from linear to advanced mode
- **THEN** each `Block` becomes a `Node` at a vertical position
- **AND** no edges are created (linear has no explicit edges)

#### Scenario: Flow to linear
- **WHEN** user switches from advanced to linear mode
- **THEN** nodes are sorted topologically
- **AND** converted back to a `Block[]`

### Requirement: Pipeline execution works in both modes

The system SHALL execute pipelines correctly regardless of the editor mode.

#### Scenario: Execute in linear mode
- **WHEN** user clicks Run in linear mode
- **THEN** the pipeline is built from `script: Block[]` with empty edges

#### Scenario: Execute in advanced mode
- **WHEN** user clicks Run in advanced mode
- **THEN** the pipeline is built from `nodes + edges` (full DAG)
