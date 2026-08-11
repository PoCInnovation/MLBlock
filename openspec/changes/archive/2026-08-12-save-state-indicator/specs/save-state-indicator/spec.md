## ADDED Requirements

### Requirement: Indicateur d'état de sauvegarde dans l'éditeur
L'éditeur SHALL désactiver le bouton « Sauvegarder » quand le pipeline n'a pas de modifications non sauvegardées (`isDirty()` false), et SHALL afficher un retour visuel « Sauvegardé » dans ce cas.

#### Scenario: Pipeline modifié
- **WHEN** l'utilisateur modifie le canvas (nœuds, arêtes, paramètres ou nom)
- **THEN** le bouton affiche « Sauvegarder » actif

#### Scenario: Pipeline à jour
- **WHEN** le pipeline vient d'être chargé ou sauvegardé sans modification depuis
- **THEN** le bouton est désactivé et affiche « Sauvegardé »

#### Scenario: Sauvegarde en cours
- **WHEN** une sauvegarde est en cours
- **THEN** le bouton est désactivé avec l'indicateur de chargement existant

### Requirement: La logique de sauvegarde est inchangée
Le changement SHALL être purement indicatif : la logique de save, stash et restauration existante reste inchangée.

#### Scenario: Sauvegarde forcée depuis le menu
- **WHEN** l'utilisateur déclenche une sauvegarde via le menu ⋮
- **THEN** la sauvegarde s'exécute normalement même si le canvas est propre
