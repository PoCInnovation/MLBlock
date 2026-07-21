## ADDED Requirements

### Requirement: Pydantic schemas for blocks
The system SHALL define Pydantic models to validate block data structures, including categories and parameters.

#### Scenario: Block parameter schema validation
- **WHEN** the server serializes a block parameter info
- **THEN** it SHALL output a dictionary with keys: `type` (string), `description` (string), `default` (any, optional), and `required` (boolean)

#### Scenario: Category schema validation
- **WHEN** the server serializes a block category
- **THEN** it SHALL output a dictionary with keys: `name` (string) and `color` (string)

#### Scenario: Block schema validation
- **WHEN** the server serializes a block definition
- **THEN** it SHALL output a dictionary with keys: `name` (string), `description` (string), `category` (Category), `params` (dictionary of string to ParamInfo), `outputs` (list of dictionaries representing output ports), and `deps` (list of strings representing pip dependencies)

### Requirement: Pydantic schemas for pipelines
The system SHALL define Pydantic models to validate pipeline creation, updates, and details.

#### Scenario: Pipeline create validation
- **WHEN** a client submits a payload to `POST /pipelines`
- **THEN** the system SHALL validate the payload against a model with `name` (string), `description` (string, optional), `nodes` (list of PipelineNode), and `edges` (list of PipelineEdge)

#### Scenario: Pipeline detail representation
- **WHEN** the system returns a pipeline detail response
- **THEN** it SHALL output a model with `id` (UUID), `name` (string), `description` (string), `nodes` (list of PipelineNode), `edges` (list of PipelineEdge), `code` (string), and standard timestamp strings
