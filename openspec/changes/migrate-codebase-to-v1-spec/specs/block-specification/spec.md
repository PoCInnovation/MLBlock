## ADDED Requirements

### Requirement: Block function declaration format
Every MLBlock block SHALL be declared as a public, callable Python function within a standard module file.

#### Scenario: Block docstring and metadata
- **WHEN** the registry inspects a block function
- **THEN** it SHALL extract the block description from the function's docstring (`fn.__doc__`) and parse parameter descriptions from the docstring args list

#### Scenario: Block signature and parameter types
- **WHEN** the registry inspects a block function signature
- **THEN** it SHALL map the name of each argument to its type hint annotation (defaulting to "Any" if missing) and identify whether the parameter is required based on the absence of a default value

#### Scenario: Block return type parsing
- **WHEN** the registry inspects a block function return annotation
- **THEN** it SHALL parse the return type into a list of output ports (represented by dictionaries containing `name` and `dtype`)
