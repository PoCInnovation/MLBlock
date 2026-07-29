## ADDED Requirements

### Requirement: Backend exposes unified catalog endpoint

The backend SHALL expose `GET /api/catalog` returning categories with their blocks and colors in a single response.

#### Scenario: Catalog returns all categories and blocks
- **WHEN** a client calls `GET /api/catalog`
- **THEN** the response MUST contain a `categories` array
- **AND** each category MUST have `id`, `name`, `color`, and `blocks`
- **AND** each block MUST have `type`, `label`, `params`, `inputs`, `outputs`
- **AND** `color` MUST come from the folder name (`neural_6366F1` → `#6366F1`)

#### Scenario: Response structure is flat but nested
- **WHEN** a client receives the catalog response
- **THEN** the response shape MUST be `{ categories: [{ id, name, color, blocks: [{ type, label, params, inputs, outputs }] }] }`

### Requirement: Old block endpoints are removed

The backend SHALL remove `GET /api/blocks`, `GET /api/blocks/categories`, and `GET /api/blocks/{type}`.

#### Scenario: Old endpoints return 404
- **WHEN** a client calls any of the removed endpoints
- **THEN** the backend MUST return 404

### Requirement: Frontend loads catalog in one call

The frontend SHALL call `GET /api/catalog` once to populate the store's `InternalCatalog`.

#### Scenario: fetchCatalog calls /api/catalog
- **WHEN** `fetchCatalog()` is called
- **THEN** it MUST make exactly 1 HTTP request to `GET /api/catalog`
- **AND** it MUST return an `InternalCatalog` with correct `categories` and `blocks`

#### Scenario: Categories include backend colors
- **WHEN** the catalog is loaded
- **THEN** each category's `color` MUST be the color from the backend, not a hardcoded frontend value

### Requirement: Frontend drops hardcoded CATEGORY_META

The frontend SHALL remove the `CATEGORY_META` constant and `FALLBACK_COLOR` from `api/client.ts`.

#### Scenario: No hardcoded colors remain
- **WHEN** the frontend source is inspected
- **THEN** there MUST be no hardcoded category color map in the codebase

### Requirement: Pagination is removed for blocks

The block catalog endpoint SHALL NOT paginate blocks. All blocks SHALL be returned in a single response.

#### Scenario: All blocks returned at once
- **WHEN** a client calls `GET /api/catalog`
- **THEN** all blocks across all categories MUST be included in the response
