# UI Type Feedback

## Purpose

Feu tricolore de compatibilité visible dans les deux espaces de travail : arêtes et connecteurs colorés, toast système, bouton « Convertir » qui matérialise le bloc convertisseur, nœuds multi-handles avec dtype.

## Requirements

### Requirement: Catalogue enrichi
The frontend catalog MUST expose each block's input and output ports (`name` + `dtype`) in addition to the existing segments.

#### Scenario: Ports dans le catalogue
- **WHEN** `fetchCatalog` termine
- **THEN** chaque `BlockDef` du store contient `inputs` et `outputs` avec `name` et `dtype`

### Requirement: Nœuds multi-handles
A block MUST render one target handle per input port and one source handle per output port, with the dtype shown on hover. A created edge MUST carry matching `sourceHandle` and `targetHandle`.

#### Scenario: Bloc multi-entrées
- **WHEN** `train_epoch` est affiché dans le canvas
- **THEN** il expose 4 handles cibles nommés `in_1` à `in_4`

#### Scenario: Bloc multi-sorties
- **WHEN** `train_test_split` est affiché dans le canvas
- **THEN** il expose 2 handles sources nommés `out_1` et `out_2`

### Requirement: Feu tricolore à la connexion
A connection attempt MUST be classified (compatible / convertible / incompatible) and handled per class: compatible → edge created; convertible → edge not created, actionable « Convertir » toast; incompatible → edge not created, error toast.

#### Scenario: Connexion compatible
- **WHEN** l'utilisateur connecte deux ports de même famille
- **THEN** l'edge est créé et affiché en vert

#### Scenario: Conversion disponible
- **WHEN** l'utilisateur connecte `pd.DataFrame → torch.Tensor` et que `df_to_tensor` existe
- **THEN** l'edge n'est pas créé, un toast orange « Convertir » s'affiche, et le clic insère `df_to_tensor` au point milieu avec les deux edges recâblés

#### Scenario: Incompatible
- **WHEN** l'utilisateur connecte deux ports sans chemin de conversion
- **THEN** la connexion est refusée et un toast rouge explique le conflit de types

### Requirement: Toast système
The app MUST provide a lightweight toast (error / conversion), auto-dismissing, with `role="alert"` and keyboard accessible. It MUST serve the orange and red connection states.

#### Scenario: Toast erreur
- **WHEN** une connexion incompatible est tentée
- **THEN** un toast rouge s'affiche, disparaît automatiquement après quelques secondes et annonce le conflit

### Requirement: Check du mode simple
In simple mode, the implicit connector between consecutive blocks (`out_1` of block N → `in_1` of block N+1) MUST be colored per the classifier: green = OK, orange = « Insérer convertisseur » button between blocks, red = incompatible badge.

#### Scenario: Chaîne valide
- **WHEN** tous les connecteurs implicites d'un script sont compatibles
- **THEN** aucun avertissement n'est affiché

#### Scenario: Conversion inter-blocs
- **WHEN** un connecteur implicite est classé convertible
- **THEN** un bouton « Insérer convertisseur » apparaît entre les deux blocs et insère le convertisseur dans le script

#### Scenario: Chaîne invalide
- **WHEN** un connecteur implicite est classé incompatible
- **THEN** un badge rouge indique le bloc fautif avec le conflit de types
