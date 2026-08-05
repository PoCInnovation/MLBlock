## ADDED Requirements

### Requirement: Bloc convertisseur df_to_tensor
Un bloc `df_to_tensor` convertit un `pd.DataFrame` en `torch.Tensor` (valeurs numériques, `float32`). Il est découvert automatiquement comme les autres blocs et participe au graphe de conversion.

#### Scenario: Conversion disponible
- **WHEN** le catalogue est chargé
- **THEN** `df_to_tensor` y figure avec `inputs: [{name: "in_1", dtype: "pd.DataFrame"}]` et `outputs: [{name: "out_1", dtype: "torch.Tensor"}]`

#### Scenario: Exécution
- **WHEN** `df_to_tensor` reçoit un DataFrame numérique
- **THEN** il retourne un `torch.Tensor` de type `float32` de même forme

### Requirement: to_tensor honnête
Le bloc `to_tensor` déclare une entrée `numpy.ndarray` (plus de wildcard `object`). Son comportement d'exécution est inchangé.

#### Scenario: Type resserré
- **WHEN** le catalogue est chargé
- **THEN** `to_tensor.inputs[0].dtype` est `numpy.ndarray`

#### Scenario: Plus de faux convertible
- **WHEN** le classifieur évalue `pd.DataFrame → to_tensor.in_1`
- **THEN** la connexion n'est pas classée convertible par `to_tensor` seul (un DataFrame n'est pas un ndarray)
