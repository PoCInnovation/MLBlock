# Type Conversion

## Purpose

Blocs convertisseurs explicites et honnêtes (`df_to_tensor`, `to_tensor`) qui participent au graphe de conversion dérivé du catalogue.

## Requirements

### Requirement: Bloc convertisseur df_to_tensor
A `df_to_tensor` block MUST convert a `pd.DataFrame` into a `torch.Tensor` (numeric values, `float32`). It MUST be auto-discovered like other blocks and MUST participate in the conversion graph.

#### Scenario: Conversion disponible
- **WHEN** le catalogue est chargé
- **THEN** `df_to_tensor` y figure avec `inputs: [{name: "in_1", dtype: "pd.DataFrame"}]` et `outputs: [{name: "out_1", dtype: "torch.Tensor"}]`

#### Scenario: Exécution
- **WHEN** `df_to_tensor` reçoit un DataFrame numérique
- **THEN** il retourne un `torch.Tensor` de type `float32` de même forme

### Requirement: to_tensor honnête
The `to_tensor` block MUST declare a `numpy.ndarray` input (no more `object` wildcard). Its runtime behavior MUST remain unchanged.

#### Scenario: Type resserré
- **WHEN** le catalogue est chargé
- **THEN** `to_tensor.inputs[0].dtype` est `numpy.ndarray`

#### Scenario: Plus de faux convertible
- **WHEN** le classifieur évalue `pd.DataFrame → to_tensor.in_1`
- **THEN** la connexion n'est pas classée convertible par `to_tensor` seul (un DataFrame n'est pas un ndarray)
