## ADDED Requirements

### Requirement: Modèles sklearn réparés
`linear_regression`, `logistic_regression` et `random_forest` entraînent sur la colonne cible du DataFrame d'entrée (`train_data[target_column]`) au lieu d'une variable inexistante.

#### Scenario: Entraînement
- **WHEN** un modèle sklearn reçoit un DataFrame avec `target_column`
- **THEN** il s'entraîne sur X = DataFrame sans la cible, y = colonne cible, sans erreur de nom

### Requirement: evaluate réparé
`evaluate` prédit sur le DataFrame de test sans colonne cible, compare à la cible réelle, et applique `method` (`mse` → erreur quadratique moyenne, sinon accuracy). Il retourne un `float`.

#### Scenario: Évaluation MSE
- **WHEN** `evaluate` reçoit un modèle, un DataFrame de test et `method: "mse"`
- **THEN** il retourne la MSE entre prédictions et cibles réelles, sans erreur de nom

#### Scenario: Évaluation accuracy
- **WHEN** `evaluate` reçoit `method: "accuracy"`
- **THEN** il retourne la proportion de prédictions correctes

### Requirement: train_test_split réparé et éclaté
`train_test_split` applique réellement `ratio`, `shuffle` et `seed` via scikit-learn et retourne un tuple `(train, test)` de DataFrames. Ses sorties sont `out_1: train` et `out_2: test` (voir multi-sorties).

#### Scenario: Split valide
- **WHEN** `train_test_split` reçoit un DataFrame et `ratio: 0.8`
- **THEN** il retourne deux DataFrames dont les tailles respectent le ratio, sans erreur de nom

#### Scenario: Sorties déclarées
- **WHEN** le catalogue est chargé
- **THEN** `train_test_split.outputs` contient deux ports nommés `out_1` et `out_2` de dtype `pd.DataFrame`

### Requirement: random_split éclaté
`random_split` retourne un tuple `(train, test)` de datasets au lieu d'un dict. Ses sorties sont `out_1` et `out_2` de dtype `torch.utils.data.Dataset`.

#### Scenario: Split dataset
- **WHEN** `random_split` reçoit un Dataset et `train_ratio: 0.8`
- **THEN** il retourne deux sous-datasets couvrant la totalité des données, éclatés en `out_1`/`out_2`
