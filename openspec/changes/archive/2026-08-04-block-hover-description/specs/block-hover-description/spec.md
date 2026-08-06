## ADDED Requirements

### Requirement: Description FR par bloc via l'API
The catalog route MUST expose a French description per block (`description` on each block object), extracted from the docstring's second line (fallback: label). The Pydantic `Block.description` stays the source.

#### Scenario: Description dans le catalogue
- **WHEN** `GET /api/catalog` est appelé
- **THEN** chaque bloc expose `description` avec la phrase FR « ce que fait le bloc »

#### Scenario: Fallback
- **WHEN** une docstring n'a pas de phrase de description
- **THEN** la description vaut le label

### Requirement: Tooltip au survol
Block descriptions MUST appear as hover tooltips on palette items and node labels in the canvas.

#### Scenario: Palette
- **WHEN** l'utilisateur survole un bloc de la palette
- **THEN** la description FR s'affiche en tooltip

#### Scenario: Node avancé
- **WHEN** l'utilisateur survole le label d'un node dans le canvas
- **THEN** la description s'affiche en tooltip
