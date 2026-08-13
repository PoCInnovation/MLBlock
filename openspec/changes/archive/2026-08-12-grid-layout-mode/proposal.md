## Why

Le canvas libre (React Flow) laisse les pipelines se désorganiser : positions flottantes, liens croisés, aucun ordre visuel. L'utilisateur veut un **second design** — une vue grille en colonnes (style kanban) — où le pipeline se lit comme un flux gauche→droite, où la position est discrète (`col/row`, 2 entiers) au lieu de flottante (`x/y`), ce qui allège l'undo/redo (1 commit par geste au lieu de par dragStart), stabilise le fingerprint (pas de drift pendant le drag) et prépare l'autosave et une parallélisation déclarative future (même colonne = nœuds indépendants).

La règle `colonne(cible) > colonne(source)` rend le graphe acyclique par construction et garantit que deux blocs de la même colonne sont indépendants — base d'une exécution par vagues ultérieure. L'utilisateur n'est **jamais bloqué** dans un déplacement (bloc ou colonne) : les liens qui violent la règle sont simplement supprimés (réversibles via undo).

## What Changes

- **Nouveau mode d'affichage de l'éditeur** : vue grille (colonnes) switchable avec le mode libre actuel via un bouton dans le header — l'ancien design reste intact et fonctionnel.
- **Modèle de données** : `position` des nœuds devient `{x, y, col?, row?}` — les deux représentations coexistent dans le dict opaque côté serveur ; le switch est non destructif (col/row dérivés de x/y au premier passage en grille).
- **Colonnes** : liste ordonnée `columns: [{id, label}]` sur le pipeline (nouveau champ optionnel serveur, rétrocompat absence → colonne « 0 »). Noms auto-incrémentés « 0, 1, 2… », renommables au clic. Gestion libre via dropdown (⋮) : **Dupliquer** (colonne + blocs, ids neufs, sans liens), **Supprimer** (colonne vide seulement), **Déplacer vers ►** (sous-menu, insertion à l'index choisi).
- **Règle de liens** : `colonne(cible) > colonne(source)`. Le connect invalide est refusé ; tout déplacement (bloc ou colonne) est accepté mais supprime les liens devenus invalides (toast + undo). Les edges hérités invalides (migration) sont affichés en orange, non bloquants, le run fonctionne (topo sort inchangé).
- **Interaction** : drop palette → colonne sélectionnée (highlightée avec la couleur de la palette des catégories) ; drag nœud → snap `col/row` au dragStop ; pan/zoom ReactFlow conservés ; colonnes dessinées en `Background` custom.
- **Sauvegarde** : bouton manuel conservé (pas d'autosave dans cette change) ; fingerprint basé sur `col/row` (stable pendant le drag).

## Capabilities

### New Capabilities
- `grid-layout-mode`: Vue grille (colonnes kanban) de l'éditeur de pipeline, switchable avec le mode libre, avec colonnes gérables (création, renommage, duplication, suppression, réordonnancement) et contrainte de liens gauche→droite.

### Modified Capabilities

## Impact

- **Frontend** : `useAppStore.ts` (viewMode, selectedCol, columns, col/row, snap, fingerprint, undo au dragStop), `FlowCanvas.tsx` (Background colonnes, règles dragStop/connect/drop, edges orange), `BlockNode.tsx` (style carte kanban), header éditeur (bouton switch + dropdown colonne), `flowConversion.ts` (position enrichie + columns).
- **Backend** : `mlblock/models/pipeline.py` — `PipelineDef.columns: list[{id, label}] | None` (optionnel) + test roundtrip. Aucun autre changement serveur ; le moteur (topo sort, run) est inchangé.
- **Compatibilité** : pipelines existants chargés en mode libre sans modification ; au premier passage en grille, col/row calculés depuis x/y (arrondi), edges backward marqués orange.
