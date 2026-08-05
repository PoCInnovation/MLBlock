## ADDED Requirements

### Requirement: Coercion des params à l'exécution
Le backend MUST coer les params strings vers leurs types déclarés (`ParamInfo.type`) avant d'appeler le builder du bloc : `int`, `float`, `bool` (`true`/`True`/`1`), `list` (`json.loads`), `str`/`file` inchangés, vide → `None` pour un param optionnel. Une coercion impossible MUST lever une erreur claire nommant le bloc et le param. Les runs linéaire ET avancé passent avec les valeurs éditées.

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
Les nodes ReactFlow MUST afficher les hyperparamètres comme segments éditables (num → input, sel → select, file → upload), réutilisant `BlockSegments`. La modification MUST mettre à jour `data.fields` du node via une action du store.

#### Scenario: Édition d'un param num
- **WHEN** l'utilisateur change `ratio` dans le node `train_test_split` du canvas
- **THEN** la valeur est enregistrée dans `data.fields` du node

#### Scenario: Sélecteur
- **WHEN** un param `Literal` est rendu dans un node avancé
- **THEN** il apparaît comme `<select>` avec les options du catalogue

### Requirement: Préservation des valeurs entre modes
Les valeurs de params éditables MUST survivre aux conversions linéaire↔avancé : `linearToFlow` propage les champs du script dans `data.fields` ; `flowToLinear` lit `data.fields`.

#### Scenario: Linéaire → avancé
- **WHEN** un script linéaire avec `ratio` édité à `0.5` bascule en avancé
- **THEN** le node affiche `0.5`, pas le défaut `0.8`

#### Scenario: Avancé → linéaire
- **WHEN** un node avancé avec un param édité bascule en linéaire
- **THEN** le bloc du script conserve la valeur éditée

### Requirement: Run avancé avec les params
Le run du mode avancé MUST envoyer `data.fields` de chaque node comme `params` du pipeline (au lieu de `{}`).

#### Scenario: Run avancé avec réglages
- **WHEN** un pipeline avancé contenant `conv2d` avec `in_channels` édité est lancé
- **THEN** le backend reçoit `in_channels` (coercé) et le build s'exécute sans erreur de paramètre
