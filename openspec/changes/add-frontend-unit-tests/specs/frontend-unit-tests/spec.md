## Purpose

Automated unit tests cover the pure, deterministic frontend logic — grid layout, dirty fingerprinting, undo/redo, type conversion, and import parsing — that currently has no verification.

## ADDED Requirements

### Requirement: Test runner available
The frontend must provide a test command that runs the unit test suite and reports pass/fail.

#### Scenario: Run test suite
- **WHEN** the developer runs `npm test` in `frontend/`
- **THEN** the unit tests execute and exit non-zero on any failure

### Requirement: Grid layout tests
Grid layout logic must be tested: column/row derivation, snap positioning, left-to-right edge validity, invalid-edge pruning, topological level computation, and column packing.

#### Scenario: Left-to-right rule enforced
- **WHEN** an edge targets a column at or left of its source column
- **THEN** the edge is classified invalid and pruned by `pruneInvalidEdges`

#### Scenario: Topological levels
- **WHEN** a DAG of blocks is migrated to the grid
- **THEN** each node's column equals its longest-path level from the sources

#### Scenario: Column packing
- **WHEN** blocks are packed into a column
- **THEN** blocks stack below the header without overlapping and within the column's content bounds

### Requirement: Dirty fingerprint tests
The dirty-detection fingerprint must be tested: only semantic fields affect it; volatile ReactFlow metadata does not; grid col/row participates while free-mode x/y does not.

#### Scenario: Volatile metadata ignored
- **WHEN** only ReactFlow metadata (selected, measured dimensions, dragging) changes
- **THEN** the fingerprint is unchanged and the pipeline is not dirty

#### Scenario: Semantic change detected
- **WHEN** a node field value or an edge connection changes
- **THEN** the fingerprint changes and the pipeline is dirty

### Requirement: Undo/redo stack tests
Undo/redo must be tested: commit points, undo/redo round-trips, the 50-entry stack cap, and redo truncation on a new commit.

#### Scenario: Stack cap
- **WHEN** more than 50 undo points are committed
- **THEN** the oldest points are evicted and the newest 50 remain

#### Scenario: Redo truncation
- **WHEN** the user undoes and then makes a new change
- **THEN** the redo stack is cleared

### Requirement: Type conversion and import parsing tests
Type-family classification, edge verdicts (compatible/convertible/incompatible), converter lookup, and MLBlock import file validation must be tested, including malformed-input branches.

#### Scenario: Malformed import
- **WHEN** an import file is not valid JSON or lacks `nodes`/`edges` arrays
- **THEN** parsing fails with a descriptive French error

#### Scenario: Conversion verdicts
- **WHEN** an edge connects two dtypes with a conversion path through transforms blocks
- **THEN** the edge is classified convertible and a converter block is found; otherwise it is incompatible
