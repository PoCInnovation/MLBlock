## ADDED Requirements

### Requirement: Métadonnées de param depuis les docstrings
The registry MUST parse structured FR suffixes from param docstrings — `(entre: 0-1, pas: 0.05)`, `(impair)`, `(choix: mse|accuracy)`, `(format: [C,H,W])`, `(longueur: 3)` — into `ParamInfo` fields `min`, `max`, `step`, `odd`, `choices`, `format`, `len`. A missing or malformed suffix MUST NOT break discovery (fields stay unset). The catalog MUST expose these fields.

#### Scenario: Fourchette et pas
- **WHEN** la docstring contient `p: Probabilité. (entre: 0-1, pas: 0.05)`
- **THEN** `ParamInfo` de `p` expose `min=0`, `max=1`, `step=0.05`

#### Scenario: Choix implicites
- **WHEN** la docstring contient `method: Métrique. (choix: mse|accuracy)`
- **THEN** `ParamInfo.method.choices == ["mse", "accuracy"]`

#### Scenario: Contrainte de parité
- **WHEN** la docstring contient `kernel_size: Filtre. (impair)`
- **THEN** `ParamInfo.kernel_size.odd == True`

#### Scenario: Suffixe absent ou mal formé
- **WHEN** une docstring n'a pas de suffixe structuré (ou un suffixe invalide)
- **THEN** la découverte continue, les champs métadonnées restent non définis

### Requirement: UI des segments assistée
The segment UI MUST render param metadata: number input with min/max/step and a discreet placeholder (fourchette), `<select>` for `choices`, JSON-format placeholder plus element count for `list` params, description tooltip. Validation MUST be live (green/red border, never blocking).

#### Scenario: Input nombre borné
- **WHEN** un param expose `entre: 0-1`
- **THEN** le champ est un `input type=number` avec min/max/step et placeholder « entre 0 et 1 »

#### Scenario: Autocomplétion de choix
- **WHEN** un param expose `choix: mse|accuracy`
- **THEN** le champ propose les deux valeurs en autocomplétion (datalist), saisie libre possible

#### Scenario: Format de liste
- **WHEN** un param `list` expose `format: [C,H,W]`
- **THEN** le placeholder montre `[C, H, W]` et une valeur non-JSON est marquée invalide en rouge (validation live)

#### Scenario: Description au survol
- **WHEN** un param a une description
- **THEN** elle s'affiche en tooltip au survol du champ

### Requirement: Validation live des métadonnées
Edited values MUST be validated live against the metadata (range, odd, choices, JSON, length) with green/red feedback; invalid values MUST remain editable (the run stays the source of truth).

#### Scenario: Valeur hors fourchette
- **WHEN** l'utilisateur saisit `1.5` pour un param `entre: 0-1`
- **THEN** le champ passe en rouge avec un message « doit être entre 0 et 1 »

#### Scenario: Valeur paire pour un param impair
- **WHEN** l'utilisateur saisit `4` pour `kernel_size (impair)`
- **THEN** le champ passe en rouge

### Requirement: Autocomplétion target_column dataflow-aware
The `target_column` fields of sklearn blocks MUST autocomplete from the columns of the source DataFrame: the UI resolves the upstream `load_csv` node (recursive edge walk in advanced mode, previous block in linear mode), fetches its columns from a new endpoint `GET /api/files/{path}/columns`, and offers them in a datalist. Free typing MUST remain possible; no resolvable source → plain field.

#### Scenario: Colonnes du CSV source
- **WHEN** `knn` reçoit son DataFrame de `load_csv` (fichier stocké) et l'utilisateur ouvre le champ `target_column`
- **THEN** les noms de colonnes du CSV sont proposés en autocomplétion

#### Scenario: Pas de source résolvable
- **WHEN** aucun `load_csv` amont n'est trouvé (ou chemin inconnu)
- **THEN** le champ reste un champ libre, sans autocomplétion
