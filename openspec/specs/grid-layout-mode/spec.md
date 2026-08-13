# Grid Layout Mode

## Purpose

L'éditeur de pipeline propose un second design : une **vue grille** en colonnes (style kanban) où les blocs s'organisent en flux gauche→droite. La vue est switchable avec le mode libre existant sans l'affecter. La position d'un bloc y est discrète (colonne + rangée), les colonnes sont gérables librement (création, renommage, duplication, suppression, réordonnancement), et une règle de liens — `colonne(cible) > colonne(source)` — rend le graphe acyclique par construction : deux blocs de la même colonne sont garantis indépendants. L'utilisateur n'est jamais bloqué dans un déplacement : les liens qui violent la règle sont supprimés (réversibles via undo).

## Requirements

### Requirement: Bascule entre vue libre et vue grille
L'éditeur SHALL proposer un contrôle de bascule entre la vue libre (design existant) et la vue grille. La bascule SHALL être non destructive : passer d'une vue à l'autre ne modifie pas les données du pipeline, et revenir en vue libre restitue le design existant tel quel.

#### Scenario: Passage en vue grille
- **WHEN** l'utilisateur active la vue grille sur un pipeline chargé en vue libre
- **THEN** chaque bloc reçoit une position de grille (colonne, rangée) dérivée de sa position libre, et le canvas s'affiche en colonnes

#### Scenario: Retour en vue libre
- **WHEN** l'utilisateur repasse en vue libre
- **THEN** le canvas libre s'affiche avec les positions existantes (libres ou dérivées de la grille), sans perte de données

### Requirement: Colonnes gérables
La vue grille SHALL permettre à l'utilisateur de gérer librement les colonnes : création, renommage, duplication, suppression et déplacement. Les colonnes SHALL être ordonnées, et leur ordre SHALL être persisté avec le pipeline.

#### Scenario: Création et nommage par défaut
- **WHEN** l'utilisateur crée une colonne
- **THEN** elle reçoit un nom par défaut auto-incrémenté (« 0 », « 1 », « 2 »…)

#### Scenario: Renommage
- **WHEN** l'utilisateur renomme une colonne
- **THEN** le nouveau nom est affiché sur son en-tête et persisté

#### Scenario: Duplication
- **WHEN** l'utilisateur duplique une colonne
- **THEN** une nouvelle colonne est créée contenant une copie de chaque bloc (nouveaux identifiants, paramètres copiés) sans aucun lien, et l'utilisateur peut la renommer

#### Scenario: Suppression d'une colonne vide
- **WHEN** l'utilisateur supprime une colonne ne contenant aucun bloc
- **THEN** la colonne disparaît et les colonnes suivantes se décalent

#### Scenario: Suppression d'une colonne contenant des blocs
- **WHEN** l'utilisateur tente de supprimer une colonne contenant au moins un bloc
- **THEN** la suppression est refusée avec un message invitant à déplacer les blocs d'abord

#### Scenario: Déplacement d'une colonne
- **WHEN** l'utilisateur déplace une colonne vers la position d'une autre colonne
- **THEN** la colonne déplacée prend la place de la colonne choisie et les autres se décalent en conséquence

### Requirement: Règle de liens gauche→droite
Dans la vue grille, un lien SHALL être valide uniquement si la colonne du bloc cible est strictement supérieure à la colonne du bloc source. Cette règle garantit qu'aucun chemin n'existe entre deux blocs de la même colonne (acyclicité par construction).

#### Scenario: Connexion invalide refusée
- **WHEN** l'utilisateur tente de connecter un bloc source vers un bloc cible dont la colonne n'est pas strictement supérieure
- **THEN** la connexion est refusée avec un message explicatif

#### Scenario: Connexion valide acceptée
- **WHEN** l'utilisateur connecte un bloc source vers un bloc cible dans une colonne strictement supérieure
- **THEN** la connexion est créée normalement

### Requirement: Les déplacements ne sont jamais bloqués
La vue grille SHALL accepter tout déplacement de bloc ou de colonne, même s'il rend des liens invalides. Les liens devenus invalides SHALL être supprimés, avec un retour visuel informant du nombre de liens retirés, et le geste SHALL être réversible via undo.

#### Scenario: Déplacement de bloc cassant des liens
- **WHEN** l'utilisateur déplace un bloc vers une colonne qui rend un ou plusieurs de ses liens invalides
- **THEN** le bloc est déplacé, les liens invalides sont supprimés, un message indique « N lien(s) retiré(s) », et Ctrl+Z restaure l'état antérieur (position et liens)

#### Scenario: Déplacement de colonne cassant des liens
- **WHEN** l'utilisateur déplace une colonne entière et que le déplacement rend des liens invalides
- **THEN** la colonne est déplacée, seuls les liens devenus invalides sont supprimés, et le geste est réversible via undo

### Requirement: Positionnement discret
Dans la vue grille, la position d'un bloc SHALL être définie par une colonne et une rangée entières. Le déplacement d'un bloc SHALL s'aligner (snap) sur la grille à la fin du geste, et le fingerprint de modification SHALL rester stable pendant le geste de déplacement.

#### Scenario: Glisser-déposer d'un bloc dans une colonne
- **WHEN** l'utilisateur glisse un bloc vers une autre colonne ou rangée
- **THEN** à la fin du geste, le bloc est aligné sur la grille avec sa nouvelle (colonne, rangée)

#### Scenario: Déplacement sans modification sémantique
- **WHEN** l'utilisateur glisse un bloc et le relâche dans la même cellule
- **THEN** aucun point d'undo n'est créé et le pipeline n'est pas marqué comme modifié

### Requirement: Dépôt depuis la palette
La vue grille SHALL déposer un bloc glissé depuis la palette dans la colonne sélectionnée, et la colonne sélectionnée SHALL être visuellement mise en évidence avec une couleur de la palette existante.

#### Scenario: Dépôt dans la colonne sélectionnée
- **WHEN** l'utilisateur sélectionne une colonne puis glisse un bloc depuis la palette
- **THEN** le bloc est ajouté à la colonne sélectionnée

### Requirement: Undo/redo par geste
Dans la vue grille, chaque geste de modification (déplacement, connexion, paramètre, renommage, duplication, suppression, réordonnancement) SHALL produire un seul point d'undo, et les piles undo/redo SHALL être réinitialisées au chargement d'un pipeline.

#### Scenario: Annulation d'un déplacement
- **WHEN** l'utilisateur annule (Ctrl+Z) après un déplacement de bloc ayant supprimé des liens
- **THEN** le bloc revient à sa position antérieure et les liens supprimés sont restaurés

### Requirement: Rétrocompatibilité des pipelines existants
Un pipeline existant (positions libres uniquement) SHALL s'ouvrir et fonctionner en vue libre sans modification de ses données. En l'absence de colonnes persistées, une colonne unique par défaut SHALL être utilisée. Les liens hérités qui violent la règle gauche→droite SHALL rester fonctionnels (l'exécution du pipeline n'est pas affectée) et SHALL être signalés visuellement (style distinct) sans bloquer l'utilisateur.

#### Scenario: Ouverture d'un pipeline existant en vue grille
- **WHEN** un pipeline stocké avec des positions libres est ouvert en vue grille
- **THEN** les blocs sont placés sur la grille (colonne, rangée dérivées de leur position), une colonne unique existe par défaut, et les liens hérités invalides sont affichés avec un style distinct

#### Scenario: Exécution d'un pipeline avec liens hérités invalides
- **WHEN** l'utilisateur exécute un pipeline contenant des liens qui violent la règle gauche→droite
- **THEN** l'exécution se déroule normalement (ordre topologique du graphe, inchangé)
