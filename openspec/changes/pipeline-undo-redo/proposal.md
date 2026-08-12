## Why

L'éditeur de pipeline ne permet pas de revenir en arrière : une erreur de manipulation (suppression d'un bloc, connexion fausse, paramètre cassé) est irréversible. C'est un manque UX majeur pour un éditeur visuel — l'utilisateur doit pouvoir annuler/rétablir ses gestes comme dans tout éditeur moderne.

## What Changes

- **Historique d'undo/redo** dans le store : pile de snapshots (max 50) de l'état sémantique du pipeline (nœuds, arêtes, nom du projet), avec index courant.
- **Points de capture** : snapshot avant chaque geste — drag de nœud (`onNodeDragStart`), drop palette, connect/conversion, suppression, édition de paramètres (coalescé au focus du champ), renommage, tout effacer. `loadPipeline`/nouveau projet **réinitialise** l'historique.
- **Raccourcis clavier** : `Ctrl`/`Cmd`+Z (undo), `Ctrl`/`Cmd`+Shift+Z et `Ctrl`/`Cmd`+Y (redo) — ignorés quand le focus est dans un champ de saisie.
- **Boutons** : `Undo2`/`Redo2` (lucide) dans le header de l'éditeur, désactivés aux bornes de la pile.
- Le nom du projet est inclus dans l'undo/redo. Le zoom/pan du viewport est hors scope.
- Aucune interaction avec le stash/unsaved-guard : `isDirty` se recale naturellement via le fingerprint.

## Capabilities

### New Capabilities
- `pipeline-undo-redo`: historique d'annulation/rétablissement des gestes d'édition du pipeline (nœuds, arêtes, paramètres, nom), via boutons et raccourcis clavier.
