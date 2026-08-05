# Block Type System

## Purpose

Dérivation des ports d'entrée des blocs depuis leurs signatures Python, multi-sorties par annotation tuple, familles de types, classifieur de compatibilité à 4 sorties et validation dtype côté serveur.

## Requirements

### Requirement: Dérivation des ports d'entrée
The system MUST derive each block's input ports (`name`, `dtype`) from its Python signature: `in_*`-prefixed parameters, the first non-`file` parameter, and data-typed parameters (`pd.DataFrame`, `torch.*`, `Model`, `object`, `tuple[...]`). Hyperparameters (int/float/bool/str/list/Literal/file) MUST never be ports.

#### Scenario: Bloc linéaire
- **WHEN** le bloc `linear(in_1: "torch.Tensor", in_features: "int", ...)` est découvert
- **THEN** ses inputs sont `[{name: "in_1", dtype: "torch.Tensor"}]` et `in_features` reste un paramètre

#### Scenario: Bloc multi-entrées
- **WHEN** le bloc `train_epoch(in_1, in_2, in_3, in_4, ...)` est découvert
- **THEN** ses inputs contiennent `in_1` à `in_4` avec leurs dtypes respectifs

#### Scenario: Bloc sans entrée de données
- **WHEN** `load_csv(path: "file")` est découvert
- **THEN** ses inputs sont vides (aucun port), `path` reste un paramètre fichier

### Requirement: Multi-sorties par annotation tuple
A return annotation `tuple[A, B]` MUST declare the outputs `out_1: A` and `out_2: B`. Execution MUST normalize a tuple result into named outputs, and edge resolution MUST use the source port (`source_port` réel).

#### Scenario: Éclatement train/test
- **WHEN** `train_test_split` retourne `(train, test)` avec l'annotation `tuple[pd.DataFrame, pd.DataFrame]`
- **THEN** ses outputs sont `out_1: pd.DataFrame` (train) et `out_2: pd.DataFrame` (test)

#### Scenario: Résolution par port
- **WHEN** un edge relie `train_test_split.out_2` vers le `in_1` d'un bloc consommateur
- **THEN** le consommateur reçoit la valeur `test`, pas le tuple ni `train`

#### Scenario: Dict mono-sortie préservé
- **WHEN** `pca` retourne un dict `{model, transformed}` avec une sortie déclarée `dict`
- **THEN** la sortie reste la valeur dict entière, inchangée

### Requirement: Classifieur de compatibilité
Every connection `A.out → B.in` MUST be classified: identity or subtype → compatible; conversion path in the catalog-derived graph → convertible; otherwise → incompatible. The conversion graph MUST be built from the catalog (a block whose input family differs from its output family is a converter), without hardcoded tables.

#### Scenario: Même famille
- **WHEN** `relu.out_1 (torch.Tensor)` est connecté à `conv2d.in_1 (torch.Tensor)`
- **THEN** la connexion est compatible

#### Scenario: Sous-type
- **WHEN** une sortie quelconque est connectée à une entrée typée `object` ou `Any`
- **THEN** la connexion est compatible

#### Scenario: Chemin de conversion
- **WHEN** `load_csv.out_1 (pd.DataFrame)` est connecté à `conv2d.in_1 (torch.Tensor)` et `df_to_tensor` existe dans le catalogue
- **THEN** la connexion est classée convertible

#### Scenario: Aucun chemin
- **WHEN** `input.out_1 (torch.Tensor)` est connecté à `knn.in_1 (pd.DataFrame)` sans convertisseur tensor→df
- **THEN** la connexion est classée incompatible

### Requirement: Validation serveur
`/api/validate` and the build MUST reject incompatible connections with a message listing the conflicting ports and dtypes. Convertible connections without a materialized converter MUST fail at build.

#### Scenario: Graphe invalide
- **WHEN** un pipeline contient une arête incompatible (rouge) et est validé
- **THEN** la réponse de validation contient une erreur `Type mismatch: <source>.<port> (<dtype>) -> <target>.<port> (<dtype>)`

#### Scenario: Graphe valide
- **WHEN** un pipeline ne contient que des arêtes compatibles ou convertibles avec convertisseurs matérialisés
- **THEN** la validation passe et le build s'exécute
