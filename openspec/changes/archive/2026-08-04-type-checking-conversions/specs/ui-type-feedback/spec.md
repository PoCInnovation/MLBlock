## ADDED Requirements

### Requirement: Catalogue enrichi
Le catalogue frontend expose pour chaque bloc ses ports d'entrée et de sortie (`name` + `dtype`), en plus des segments existants.

#### Scenario: Ports dans le catalogue
- **WHEN** `fetchCatalog` termine
- **THEN** chaque `BlockDef` du store contient `inputs` et `outputs` avec `name` et `dtype`

### Requirement: Nœuds multi-handles
Un bloc rend un handle cible par port d'entrée et un handle source par port de sortie, avec le dtype affiché au survol. Un edge créé porte `sourceHandle` et `targetHandle` correspondants.

#### Scenario: Bloc multi-entrées
- **WHEN** `train_epoch` est affiché dans le canvas
- **THEN** il expose 4 handles cibles nommés `in_1` à `in_4`

#### Scenario: Bloc multi-sorties
- **WHEN** `train_test_split` est affiché dans le canvas
- **THEN** il expose 2 handles sources nommés `out_1` et `out_2`

### Requirement: Feu tricolore à la connexion
Une tentative de connexion est classée (compatible / convertible / incompatible) et traitée selon sa classe : compatible → edge créé ; convertible → edge non créé, toast actionnable « Convertir » ; incompatible → edge non créé, toast d'erreur.

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
L'application dispose d'un toast léger (erreur / conversion), auto-dismiss, avec `role="alert"` et accessible au clavier. Il sert aux états orange et rouge de la connexion.

#### Scenario: Toast erreur
- **WHEN** une connexion incompatible est tentée
- **THEN** un toast rouge s'affiche, disparaît automatiquement après quelques secondes et annonce le conflit

### Requirement: Check du mode simple
En mode simple, le connecteur implicite entre blocs consécutifs (`out_1` du bloc N → `in_1` du bloc N+1) est coloré selon le classifieur : vert = OK, orange = bouton « Insérer convertisseur » inter-blocs, rouge = badge incompatible.

#### Scenario: Chaîne valide
- **WHEN** tous les connecteurs implicites d'un script sont compatibles
- **THEN** aucun avertissement n'est affiché

#### Scenario: Conversion inter-blocs
- **WHEN** un connecteur implicite est classé convertible
- **THEN** un bouton « Insérer convertisseur » apparaît entre les deux blocs et insère le convertisseur dans le script

#### Scenario: Chaîne invalide
- **WHEN** un connecteur implicite est classé incompatible
- **THEN** un badge rouge indique le bloc fautif avec le conflit de types
