# frontend-foundations

## Purpose

Le frontend repose sur un socle de styles cohérent (tokens du design system exposés en variables CSS), l'état de l'éditeur est partageable via l'URL (pipeline et vue), et l'état serveur (données, exécution des runs) est géré de manière fiable, sans suivi en arrière-plan résiduel.

## Requirements

### Requirement: Tokens de conception disponibles
Le système DOIT exposer l'ensemble des couleurs, espacements, rayons et ombres du design system sous forme de variables CSS, utilisables par les classes utilitaires et les styles dynamiques. La valeur appliquée d'une variable DOIT correspondre à la valeur définie dans le design system.

#### Scenario: Utilisation d'une couleur du design system
- **WHEN** un composant référence la variable CSS d'une couleur du design system (ex. accent, surface, textMuted)
- **THEN** la couleur affichée est exactement la valeur définie dans le design system

#### Scenario: Espacements, rayons et ombres
- **WHEN** un composant utilise une classe utilitaire d'espacement, de rayon ou d'ombre
- **THEN** la valeur appliquée est celle du design system correspondant

### Requirement: Rendu visuel préservé
Après la mise en place du socle de styles, l'interface DOIT conserver son apparence existante : mêmes couleurs, espacements, rayons et ombres sur les composants et pages migrés, sans régression visuelle.

#### Scenario: Éditeur inchangé visuellement
- **WHEN** l'utilisateur ouvre l'éditeur après la migration
- **THEN** le canvas, les blocs, la palette et les panneaux affichent les mêmes couleurs, espacements et rayons qu'avant la migration

#### Scenario: Composants d'interface
- **WHEN** l'utilisateur ouvre un dialog, un menu déroulant, une carte, un champ de formulaire ou un hover card
- **THEN** l'apparence (couleurs, rayons, ombres, espacements) est identique à celle d'avant la migration

### Requirement: Couleurs dynamiques via tokens
Les couleurs calculées dynamiquement (couleur d'un bloc selon sa catégorie, couleurs du canvas) DOIVENT être résolues depuis les variables CSS du design system et rester fonctionnelles après la migration.

#### Scenario: Changement de catégorie d'un bloc
- **WHEN** l'utilisateur change la catégorie d'un bloc
- **THEN** la couleur associée au bloc (ex. bordure) devient celle de la nouvelle catégorie, résolue depuis les tokens

#### Scenario: Couleurs du canvas
- **WHEN** le canvas est affiché en vue libre ou en vue grille
- **THEN** les couleurs de fond et de grille proviennent des tokens du design system

### Requirement: Composants d'interface unifiés
Les composants d'interface partagés (dialogs, menus déroulants, hover cards, séparateurs, cartes, champs) DOIVENT être construits sur le même socle de tokens et présenter un rendu cohérent dans toute l'application. Tout nouveau composant d'interface DOIT suivre ce même socle.

#### Scenario: Cohérence entre pages
- **WHEN** l'utilisateur ouvre le même type de composant (ex. dialog) depuis des pages différentes
- **THEN** le composant présente un rendu identique (couleurs, rayons, ombres, espacements)

#### Scenario: Nouveau composant d'interface
- **WHEN** un nouveau composant d'interface est ajouté à l'application
- **THEN** il utilise les tokens du design system et respecte le rendu commun

### Requirement: État de l'éditeur dans l'URL
L'éditeur DOIT lire et écrire son état dans l'URL au format `/editor?pipeline=<uuid>&view=free|grid`, où `pipeline` est l'identifiant du pipeline ouvert et `view` la vue active. À l'ouverture de l'éditeur, un `pipeline` valide DOIT charger le pipeline correspondant et `view` DOIT initialiser la vue.

#### Scenario: Ouverture avec pipeline et vue
- **WHEN** l'utilisateur ouvre `/editor?pipeline=<uuid valide>&view=grid`
- **THEN** le pipeline correspondant est chargé et la vue grille est active

#### Scenario: Changement de vue
- **WHEN** l'utilisateur bascule la vue (libre ↔ grille)
- **THEN** l'URL est mise à jour avec la nouvelle valeur de `view`, sans rechargement de page

#### Scenario: Ouverture d'un pipeline
- **WHEN** l'utilisateur ouvre un pipeline depuis la liste des projets
- **THEN** l'URL de l'éditeur contient l'identifiant du pipeline ouvert

### Requirement: Rafraîchissement préservé
Un rechargement de la page éditeur DOIT restaurer le pipeline ouvert et la vue active à partir de l'URL.

#### Scenario: Refresh avec pipeline ouvert
- **WHEN** l'utilisateur recharge la page alors qu'un pipeline est ouvert en vue grille
- **THEN** le même pipeline est rechargé et la vue grille est restaurée

#### Scenario: Refresh sans paramètres
- **WHEN** l'utilisateur recharge la page ouverte sur `/editor` sans paramètres
- **THEN** l'éditeur s'ouvre vide avec la vue par défaut (libre)

### Requirement: Vue partageable
L'URL de l'éditeur DOIT être partageable : ouverte dans une autre session, elle DOIT charger le même pipeline avec la même vue.

#### Scenario: Partage de l'URL
- **WHEN** l'utilisateur copie l'URL de l'éditeur et l'ouvre dans une autre session
- **THEN** le pipeline indiqué est chargé avec la vue indiquée

### Requirement: Défauts sûrs sur URL invalide
Une URL sans paramètres, avec un `pipeline` invalide ou une `view` invalide DOIT produire un état sûr : aucun pipeline chargé (éditeur vide) et vue par défaut, sans erreur ni crash.

#### Scenario: URL sans paramètres
- **WHEN** l'utilisateur ouvre `/editor` sans paramètres
- **THEN** l'éditeur s'ouvre vide avec la vue par défaut (libre)

#### Scenario: Identifiant invalide
- **WHEN** l'utilisateur ouvre `/editor?pipeline=<uuid invalide ou inexistant>`
- **THEN** aucun pipeline n'est chargé, l'éditeur s'ouvre vide et aucun crash ne se produit

#### Scenario: Vue invalide
- **WHEN** l'utilisateur ouvre `/editor?view=autre-valeur`
- **THEN** la vue par défaut (libre) est appliquée

### Requirement: URL limitée à l'identifiant et à la vue
L'URL de l'éditeur NE DOIT contenir que l'identifiant du pipeline et la vue. Les positions des blocs NE DOIVENT PAS apparaître dans l'URL ; elles sont restaurées depuis le pipeline sauvegardé.

#### Scenario: Déplacement de blocs
- **WHEN** l'utilisateur déplace des blocs sur le canvas puis inspecte l'URL
- **THEN** l'URL ne contient que `pipeline` et `view`, sans aucune position

### Requirement: Chargement des données
Le système DOIT afficher un état de chargement pendant la récupération des données (catalogue, listes de pipelines, pipeline) et un état d'erreur si la récupération échoue. Après une modification (sauvegarde, suppression), les listes DOIVENT refléter les changements.

#### Scenario: Chargement d'une liste
- **WHEN** l'utilisateur ouvre la liste des projets pendant la récupération des données
- **THEN** un état de chargement est affiché jusqu'à l'arrivée des données

#### Scenario: Échec de récupération
- **WHEN** la récupération d'une ressource échoue
- **THEN** un état d'erreur est affiché, sans blocage de l'application

#### Scenario: Liste à jour après modification
- **WHEN** l'utilisateur sauvegarde ou supprime un pipeline puis consulte la liste des projets
- **THEN** la liste reflète la modification (nom à jour, pipeline supprimé absent)

### Requirement: Suivi de l'exécution d'un run
Lorsqu'un run est lancé, le système DOIT suivre son exécution jusqu'à son terme et refléter l'état en cours dans l'interface. Tant qu'un run est en cours, un nouveau lancement NE DOIT PAS être possible.

#### Scenario: Lancement d'un run
- **WHEN** l'utilisateur lance l'exécution du pipeline
- **THEN** l'interface indique que le run est en cours (bouton d'exécution désactivé ou en état « en cours »)

#### Scenario: Double lancement impossible
- **WHEN** un run est déjà en cours
- **THEN** aucun second run ne peut être lancé tant que le premier n'est pas terminé, arrêté ou en erreur

#### Scenario: Terminaison du run
- **WHEN** le run se termine avec succès ou en erreur
- **THEN** l'interface revient à l'état inactif et le lancement redevient possible

### Requirement: Fin du suivi à la fin du run
Le suivi de l'exécution DOIT s'arrêter dès que le run est terminé (succès ou erreur) : plus aucune requête de suivi NE DOIT être émise après la fin du run.

#### Scenario: Run réussi
- **WHEN** le run se termine avec succès
- **THEN** le suivi cesse et aucune requête de suivi n'est émise ensuite

#### Scenario: Run en erreur
- **WHEN** le run se termine en erreur
- **THEN** le suivi cesse et l'erreur est signalée dans l'interface

### Requirement: Absence de suivi résiduel
Le suivi de l'exécution DOIT cesser lorsque l'utilisateur quitte l'éditeur ou arrête le run : aucune requête de suivi NE DOIT continuer en arrière-plan.

#### Scenario: Sortie de l'éditeur pendant un run
- **WHEN** l'utilisateur navigue hors de l'éditeur alors qu'un run est en cours
- **THEN** le suivi s'arrête et aucune requête de suivi n'est émise en arrière-plan

#### Scenario: Arrêt du run
- **WHEN** l'utilisateur arrête le run pendant son exécution
- **THEN** l'attente du run cesse, l'interface revient à l'état inactif et le suivi s'arrête

### Requirement: Sorties chargées quand le run est terminé
Les sorties du run DOIVENT être chargées et affichées lorsque le run est terminé. Pendant l'exécution, les sorties ne sont pas disponibles. Un échec de chargement des sorties DOIT être signalé.

#### Scenario: Run en cours
- **WHEN** le run est en cours
- **THEN** les sorties ne sont pas encore affichées (indication d'attente)

#### Scenario: Run terminé avec succès
- **WHEN** le run se termine avec succès
- **THEN** les sorties sont chargées et affichées

#### Scenario: Sorties indisponibles
- **WHEN** le chargement des sorties échoue
- **THEN** l'échec est signalé dans l'interface

### Requirement: Erreurs d'exécution par étape
Les erreurs survenant pendant un run (graphe invalide, échec de build, erreur de suivi) DOIVENT être signalées à l'utilisateur, notamment via la console de l'éditeur, chacune à l'étape où elle survient.

#### Scenario: Graphe invalide
- **WHEN** l'utilisateur lance un run avec un graphe invalide
- **THEN** un message d'erreur est affiché dans la console et le run ne démarre pas

#### Scenario: Échec de build
- **WHEN** la construction du pipeline échoue
- **THEN** l'échec est signalé dans la console et l'interface revient à l'état inactif
