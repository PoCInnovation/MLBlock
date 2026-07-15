## ADDED Requirements

### Requirement: Filter blocks by category

The server MUST support filtering the block list by category name via query parameter.

#### Scenario: Filter by single category
- **WHEN** `GET /api/blocks?category=neural` is called
- **THEN** only blocks whose category name is `neural` are returned

#### Scenario: Category does not exist
- **WHEN** `GET /api/blocks?category=nonexistent` is called
- **THEN** an empty list is returned (not an error)

#### Scenario: No category filter
- **WHEN** `GET /api/blocks` is called without `?category=`
- **THEN** all blocks are returned (existing behavior unchanged)

### Requirement: Search blocks by text

The server MUST support text search across block names and descriptions via query parameter.

#### Scenario: Search by name substring
- **WHEN** `GET /api/blocks?q=conv` is called
- **THEN** blocks whose name or description contains `conv` (case-insensitive) are returned

#### Scenario: Search with no matches
- **WHEN** `GET /api/blocks?q=xyznonexistent` is called
- **THEN** an empty list is returned

#### Scenario: Combined filters
- **WHEN** `GET /api/blocks?category=neural&q=conv` is called
- **THEN** only blocks matching both the category AND the search term are returned

### Requirement: List categories with counts

The server MUST return all categories with the number of blocks in each.

#### Scenario: Get category list
- **WHEN** `GET /api/blocks/categories` is called
- **THEN** a list of `{ name, color, block_count }` objects is returned, one per category
