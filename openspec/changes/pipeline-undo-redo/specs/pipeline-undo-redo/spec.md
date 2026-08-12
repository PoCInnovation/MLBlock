## ADDED Requirements

### Requirement: Historique d'undo/redo du pipeline
L'éditeur SHALL maintenir un historique d'annulation/rétablissement des gestes d'édition : ajout/suppression/déplacement de nœuds, connexions, conversions, édition de paramètres et nom du projet. L'historique SHALL être limité à 50 snapshots et réinitialisé à l'ouverture/import d'un pipeline ou à la création d'un nouveau projet.

#### Scenario: Undo d'un drag
- **WHEN** l'utilisateur déplace un nœud puis déclenche l'undo
- **THEN** le nœud revient à sa position précédente (un seul pas d'undo par geste de drag, pas par pixel)

#### Scenario: Undo d'une suppression
- **WHEN** l'utilisateur supprime un nœud ou une arête puis déclenche l'undo
- **THEN** l'élément supprimé est restauré

#### Scenario: Undo d'un paramètre
- **WHEN** l'utilisateur modifie un paramètre d'un bloc (plusieurs frappes) puis déclenche l'undo
- **THEN** le paramètre revient à sa valeur précédente en un seul pas d'undo (pas par caractère)

#### Scenario: Undo du nom du projet
- **WHEN** l'utilisateur renomme le projet puis déclenche l'undo
- **THEN** le nom revient à sa valeur précédente

#### Scenario: Changement de pipeline
- **WHEN** l'utilisateur ouvre, importe ou crée un pipeline
- **THEN** l'historique d'undo/redo est réinitialisé (pas de fuite d'un pipeline à l'autre)

#### Scenario: Limite d'historique
- **WHEN** plus de 50 gestes sont effectués
- **THEN** les snapshots les plus anciens sont évincés

### Requirement: Boutons d'undo/redo
L'éditeur SHALL afficher des boutons « Annuler » et « Rétablir » dans le header, désactivés quand il n'y a rien à annuler ou à rétablir.

#### Scenario: Pas d'historique
- **WHEN** aucun geste n'a encore été effectué
- **THEN** le bouton Annuler est désactivé

#### Scenario: Fin de la pile
- **WHEN** tous les gestes ont été rétablis
- **THEN** le bouton Rétablir est désactivé

### Requirement: Raccourcis clavier
L'éditeur SHALL répondre aux raccourcis `Ctrl`/`Cmd`+Z (annuler), `Ctrl`/`Cmd`+Shift+Z et `Ctrl`/`Cmd`+Y (rétablir). Ces raccourcis SHALL être ignorés quand le focus est dans un champ de saisie (input, textarea, contenu éditable).

#### Scenario: Undo clavier
- **WHEN** l'utilisateur presse Ctrl+Z (ou Cmd+Z sur macOS) hors d'un champ de saisie
- **THEN** le dernier geste est annulé

#### Scenario: Redo clavier
- **WHEN** l'utilisateur presse Ctrl+Shift+Z ou Ctrl+Y (ou équivalents Cmd sur macOS) hors d'un champ de saisie
- **THEN** le dernier geste annulé est rétabli

#### Scenario: Focus dans un champ de saisie
- **WHEN** le focus est dans un input ou textarea et que l'utilisateur presse Ctrl+Z
- **THEN** le raccourci est ignoré (le champ texte gère sa propre annulation)

### Requirement: Cohérence avec l'état de sauvegarde
L'undo/redo SHALL laisser `isDirty()` se recalculer naturellement : restaurer un état non sauvegardé rend le pipeline modifié, restaurer l'état sauvegardé le rend propre.

#### Scenario: Undo vers un état sauvegardé
- **WHEN** l'undo restaure l'état exact du dernier enregistrement
- **THEN** le bouton Sauvegarder redevient « Sauvegardé » (désactivé)

#### Scenario: Undo vers un état modifié
- **WHEN** l'undo restaure un état antérieur non sauvegardé
- **THEN** le bouton Sauvegarder reste actif
