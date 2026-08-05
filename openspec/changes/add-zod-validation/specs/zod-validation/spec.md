## ADDED Requirements

### Requirement: Build type-checks with tsc

The frontend build SHALL run `tsc --noEmit` before `vite build`.

#### Scenario: Type error blocks build
- **WHEN** the code contains a TypeScript error
- **THEN** `npm run build` fails
- **AND** no bundle is produced

#### Scenario: Clean code builds
- **WHEN** the code has no TypeScript errors
- **THEN** `npm run build` succeeds

### Requirement: Edges use snake_case fields

The pipeline edges sent to the backend SHALL use `source_port` and `target_port`.

#### Scenario: Advanced mode edges valid
- **WHEN** a pipeline runs in advanced mode with edges
- **THEN** the payload uses `source_port`/`target_port`
- **AND** the backend receives the connection data

### Requirement: flowToLinear converts correctly

`flowToLinear` SHALL map node data to linear blocks without type errors.

#### Scenario: Nodes convert to blocks
- **WHEN** a flow node with a text label and params converts to linear
- **THEN** the resulting block has the correct type and fields
- **AND** no runtime error occurs

### Requirement: Login form validated with Zod

The login form SHALL validate its inputs with a Zod schema before submission.

#### Scenario: Invalid email shows error
- **WHEN** user enters a malformed email
- **THEN** an error message "Email invalide" is shown
- **AND** the form does not submit

#### Scenario: Short password shows error
- **WHEN** user enters a password shorter than 6 characters
- **THEN** an error message "Minimum 6 caractères" is shown
- **AND** the form does not submit

### Requirement: Register form validated with Zod

The register form SHALL validate email, password, and confirmation with a Zod schema.

#### Scenario: Password mismatch rejected
- **WHEN** password and confirmation differ
- **THEN** an error message "Les mots de passe ne correspondent pas" is shown
- **AND** the form does not submit

### Requirement: Catalog response parsed with Zod

The catalog API response SHALL be validated with a Zod schema instead of a type assertion.

#### Scenario: Valid catalog parses
- **WHEN** `fetchCatalog` receives a valid catalog response
- **THEN** it parses with `catalogSchema`
- **AND** returns the inferred type

#### Scenario: Invalid catalog throws
- **WHEN** the catalog response does not match the schema
- **THEN** the parse throws an error
- **AND** the editor shows the unavailable modal

### Requirement: Types derived from Zod schemas

TypeScript types for validated data SHALL be derived via `z.infer`.

#### Scenario: Inferred types replace manual interfaces
- **WHEN** a data shape has a Zod schema
- **THEN** its TypeScript type is `z.infer<typeof schema>` instead of a manual interface
