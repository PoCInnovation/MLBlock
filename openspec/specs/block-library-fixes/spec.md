# Block Library Fixes

## Purpose

Réparation des blocs cassés de la bibliothèque (NameError garantis) et éclatement des sorties composées en ports multiples.

## Requirements

### Requirement: Modèles sklearn réparés
`linear_regression`, `logistic_regression` and `random_forest` MUST train on the target column of the input DataFrame (`train_data[target_column]`) instead of a nonexistent variable.

#### Scenario: Entraînement
- **WHEN** un modèle sklearn reçoit un DataFrame avec `target_column`
- **THEN** il s'entraîne sur X = DataFrame sans la cible, y = colonne cible, sans erreur de nom

### Requirement: evaluate réparé
`evaluate` MUST predict on the test DataFrame without the target column, compare to the real target, and apply `method` (`mse` → mean squared error, otherwise accuracy). It MUST return a `float`.

#### Scenario: Évaluation MSE
- **WHEN** `evaluate` reçoit un modèle, un DataFrame de test et `method: "mse"`
- **THEN** il retourne la MSE entre prédictions et cibles réelles, sans erreur de nom

#### Scenario: Évaluation accuracy
- **WHEN** `evaluate` reçoit `method: "accuracy"`
- **THEN** il retourne la proportion de prédictions correctes

### Requirement: train_test_split réparé et éclaté
`train_test_split` MUST actually apply `ratio`, `shuffle` and `seed` via scikit-learn and return a `(train, test)` tuple of DataFrames. Its outputs MUST be `out_1: train` and `out_2: test` (see multi-sorties).

#### Scenario: Split valide
- **WHEN** `train_test_split` reçoit un DataFrame et `ratio: 0.8`
- **THEN** il retourne deux DataFrames dont les tailles respectent le ratio, sans erreur de nom

#### Scenario: Sorties déclarées
- **WHEN** le catalogue est chargé
- **THEN** `train_test_split.outputs` contient deux ports nommés `out_1` et `out_2` de dtype `pd.DataFrame`

### Requirement: random_split éclaté
`random_split` MUST return a `(train, test)` tuple of datasets instead of a dict. Its outputs MUST be `out_1` and `out_2` of dtype `torch.utils.data.Dataset`.

#### Scenario: Split dataset
- **WHEN** `random_split` reçoit un Dataset et `train_ratio: 0.8`
- **THEN** il retourne deux sous-datasets couvrant la totalité des données, éclatés en `out_1`/`out_2`
