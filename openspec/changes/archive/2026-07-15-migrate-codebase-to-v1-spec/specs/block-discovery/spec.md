## ADDED Requirements

### Requirement: Registry discovery scanning
The system SHALL scan the `mlblock/blocks/` directory recursively to register block functions dynamically at startup.

#### Scenario: Category resolution from folders
- **WHEN** the registry scans a block directory
- **THEN** it SHALL extract the category name and hex color from the directory name using the `NAME_COLOR` convention (e.g. `neural_6366F1` resolves to Category name "neural", color "#6366F1")

#### Scenario: Function filtering and registration
- **WHEN** the registry scans a module file
- **THEN** it SHALL import the module and inspect its attributes, registering only public, callable functions declared within that module and ignoring helper functions starting with `_`

### Requirement: Dependency auto-discovery
The system SHALL extract external package dependencies for each registered block function by scanning the import statements of its module file.

#### Scenario: Parse and map imports
- **WHEN** the registry inspects a block function
- **THEN** it SHALL read the source code of the containing module, identify imports of external packages (excluding standard libraries), and map import names to installation names using `IMPORT_TO_PIP` (e.g. `sklearn` to `scikit-learn`)
