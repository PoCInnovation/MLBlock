## Purpose

L'affichage des blocs expose les noms des paramètres et les types des sorties, avec des suggestions de saisie et des libellés français.

## Requirements

### Requirement: Noms des sorties visibles
Block nodes in advanced mode MUST display each output port as a visible line (`name · dtype`) inside the node, in addition to the connection handle. Input ports MAY stay tooltip-only.

#### Scenario: Sortie visible
- **WHEN** `train_test_split` est affiché dans le canvas
- **THEN** les sorties `out_1 · pd.DataFrame` et `out_2 · pd.DataFrame` sont visibles dans le node, sans survol

#### Scenario: Handle conservé
- **WHEN** l'utilisateur connecte une sortie
- **THEN** le handle source fonctionne comme avant (le label est informatif, pas un élément de connexion)

### Requirement: Noms des params visibles
Every editable param field MUST display its name next to the control (`ratio: [0.8]`), in both linear and advanced modes.

#### Scenario: Champ nommé
- **WHEN** `train_test_split` est rendu en mode linéaire ou avancé
- **THEN** chaque champ affiche son nom (`ratio`, `shuffle`, `seed`) à côté du contrôle

### Requirement: Suggestions de valeurs
The docstring grammar MUST support `(suggestions: a|b|c)` parsed into `ParamInfo.suggestions`, rendered as a datalist on the field (text input). Suggestions MUST NOT constrain the value (no red validation) — they are hints only.

#### Scenario: Suggestions numériques
- **WHEN** un param expose `(suggestions: 16|32|64|128)`
- **THEN** le champ propose ces valeurs en autocomplétion et reste libre

#### Scenario: Suffixe inconnu toléré
- **WHEN** une docstring contient un suffixe inconnu
- **THEN** la découverte continue sans erreur

### Requirement: Labels de blocs en français
Block labels MUST come from the first line of the French docstring when meaningful, falling back to `name.title()` otherwise. The palette header MUST be « Blocs » and search placeholder « Rechercher un bloc… ».

#### Scenario: Label depuis docstring
- **WHEN** `load_csv` a pour docstring « Charger un CSV. »
- **THEN** le catalogue expose le label « Charger un CSV »

#### Scenario: Fallback
- **WHEN** une docstring est vide ou générique
- **THEN** le label reste `name.title()`

#### Scenario: Palette FR
- **WHEN** la palette est rendue
- **THEN** le header est « Blocs » et le placeholder « Rechercher un bloc… »
