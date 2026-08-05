# Advanced Mode Params

## Purpose

Hyperparamètres des blocs éditables et exécutables en mode avancé : coercion backend des valeurs (strings → types déclarés), nodes ReactFlow éditables, préservation des valeurs entre modes linéaire/avancé, run avancé avec les réglages.

## Requirements

### Requirement: Coercion des params à l'exécution
The backend MUST coerce string params to their declared types (`ParamInfo.type`) before calling the block builder: `int`, `float`, `bool` (`true`/`True`/`1`), `list` (`json.loads`), `str`/`file` unchanged, empty → `None` for an optional param. An impossible coercion MUST raise a clear error naming the block and the param. Both linear and advanced runs MUST execute with the edited values.

#### Scenario: Params int depuis le frontend
- **WHEN** `linear` reçoit `in_features: "4"`, `out_features: "8"` et `bias: "true"` (strings UI)
- **THEN** le bloc s'exécute (`nn.Linear(in_features=4, out_features=8, bias=True)`) sans TypeError

#### Scenario: Param list
- **WHEN** `input` reçoit `shape: "[1, 28, 28]"`
- **THEN** le bloc reçoit la liste Python `[1, 28, 28]`

#### Scenario: Param optionnel vide
- **WHEN** un param optionnel (`int | None`) reçoit `""`
- **THEN** le bloc reçoit `None`

#### Scenario: Coercion impossible
- **WHEN** un param `int` reçoit une valeur non-numérique
- **THEN** l'exécution échoue avec une erreur mentionnant le nom du bloc et du param

### Requirement: Params éditables dans les nodes avancés
ReactFlow nodes MUST render hyperparams as editable segments (num → input, sel → select, file → upload) by reusing `BlockSegments`. Editing MUST update the node's `data.fields` via a store action. Data-port params MUST NOT appear as editable fields.

#### Scenario: Édition d'un param num
- **WHEN** l'utilisateur change `ratio` dans le node `train_test_split` du canvas
- **THEN** la valeur est enregistrée dans `data.fields` du node

#### Scenario: Sélecteur
- **WHEN** un param `Literal` est rendu dans un node avancé
- **THEN** il apparaît comme `<select>` avec les options du catalogue

#### Scenario: Port de données exclu
- **WHEN** `train_test_split` est affiché dans le canvas
- **THEN** `dataset` n'apparaît pas comme champ éditable (c'est un handle de connexion)

### Requirement: Préservation des valeurs entre modes
Editable param values MUST survive linear↔advanced conversions: `linearToFlow` propagates the script fields into `data.fields`; `flowToLinear` reads `data.fields`.

#### Scenario: Linéaire → avancé
- **WHEN** un script linéaire avec `ratio` édité à `0.5` bascule en avancé
- **THEN** le node affiche `0.5`, pas le défaut `0.8`

#### Scenario: Avancé → linéaire
- **WHEN** un node avancé avec un param édité bascule en linéaire
- **THEN** le bloc du script conserve la valeur éditée

### Requirement: Run avancé avec les params
The advanced-mode run MUST send each node's `data.fields` as pipeline `params` (instead of `{}`).

#### Scenario: Run avancé avec réglages
- **WHEN** un pipeline avancé contenant `conv2d` avec `in_channels` édité est lancé
- **THEN** le backend reçoit `in_channels` (coercé) et le build s'exécute sans erreur de paramètre
