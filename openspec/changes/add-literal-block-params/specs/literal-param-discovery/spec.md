## ADDED Requirements

### Requirement: ParamInfo includes options field
The `ParamInfo` schema SHALL include an optional `options` field of type `list[str] | None`, defaulting to `None`.

#### Scenario: Parameter with no options
- **WHEN** a block parameter has type `int` or `str` without `Literal`
- **THEN** the `options` field in `ParamInfo` SHALL be `null`

#### Scenario: Parameter with options
- **WHEN** a block parameter has type `Literal["relu", "sigmoid", "tanh"]`
- **THEN** the `options` field in `ParamInfo` SHALL be `["relu", "sigmoid", "tanh"]`

### Requirement: Discovery detects Literal type hints
The `_inspect_function` in `registry.py` SHALL detect `typing.Literal` annotations on block function parameters and populate `ParamInfo.options` with the allowed values.

#### Scenario: Literal detected
- **WHEN** a block function has a parameter annotated as `Literal["a", "b", "c"]`
- **THEN** the discovered `ParamInfo` for that parameter SHALL have `type="str"` and `options=["a", "b", "c"]`

#### Scenario: Non-Literal parameter ignored
- **WHEN** a block function has a parameter annotated as `str` or `int`
- **THEN** the discovered `ParamInfo` for that parameter SHALL have `options=null`

#### Scenario: Literal with non-string values
- **WHEN** a block function has a parameter annotated as `Literal[1, 2, 3]`
- **THEN** the discovered `ParamInfo` SHALL have `type="int"` and `options=["1", "2", "3"]` (stringified for API consistency)

### Requirement: Block signatures use Literal for choice parameters
Block functions with parameters that have a fixed set of valid values SHALL use `typing.Literal` to declare those values.

#### Scenario: Activation parameter
- **WHEN** a neural block accepts an `activation` parameter with choices like relu, sigmoid, tanh
- **THEN** the parameter SHALL be typed as `Literal["relu", "sigmoid", "tanh", "none"]`

#### Scenario: Padding parameter
- **WHEN** a conv block accepts a `padding` parameter with choices like valid, same
- **THEN** the parameter SHALL be typed as `Literal["valid", "same"]` or include numeric options as appropriate

#### Scenario: Task parameter
- **WHEN** a model block accepts a `task` parameter (classification vs regression)
- **THEN** the parameter SHALL be typed as `Literal["classification", "regression"]`
