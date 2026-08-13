## 1. Spike technique

- [x] 1.1 Valider le `Background` custom React Flow (colonnes qui suivent le viewport) avec pan/zoom actifs — composant jetable
- [x] 1.2 Valider le snap au `onNodeDragStop` (position → col/row → réécriture position) et l'absence de commit undo au dragStart
- [x] 1.3 Valider le composant menu (Base UI DropdownMenu ou menu maison léger) pour le dropdown de colonne

## 2. Backend : colonnes sur le pipeline

- [x] 2.1 `PipelineNode`/`PipelineDef` : ajouter `columns: list[{id, label}] | None = None` (optionnel) dans `mlblock/models/pipeline.py`
- [x] 2.2 Test backend : roundtrip d'un pipeline avec `columns` (création → fetch → identique), et absence de `columns` → rétrocompat

## 3. Store : modèle grille

- [x] 3.1 `AppState` : `viewMode: 'free' | 'grid'`, `selectedCol: string | null`, `columns: {id, label}[]`
- [x] 3.2 `loadPipeline` : lire `position.col/row` (nouveau) ou dériver depuis x/y (ancien) ; initialiser `columns` (absence → colonne « 0 »)
- [x] 3.3 `setCatalog` (backfill) : préserver col/row des nœuds existants
- [x] 3.4 `fingerprintOf` : inclure col/row ET x/y (stable pendant le drag en grille)
- [x] 3.5 Helpers colonnes : créer (nom auto-incrémenté), renommer, dupliquer (blocs + ids neufs, sans liens), supprimer (vide seulement), déplacer vers (insertion à l'index)
- [x] 3.6 Règle de liens : validation `colonne(cible) > colonne(source)` ; suppression des liens invalides après déplacement (bloc ou colonne) + toast avec compteur
- [x] 3.7 Undo : commit au `onNodeDragStop` (et seulement si col/row a changé), pas au dragStart

## 4. Canvas : vue grille

- [x] 4.1 `FlowCanvas` : brancher le `Background` colonnes (rendu conditionnel sur `viewMode === 'grid'`)
- [x] 4.2 `onNodeDragStop` : snap col/row + application de la règle (suppression des liens invalides)
- [x] 4.3 `onConnect` : refus si `colonne(cible) <= colonne(source)` (mode grille)
- [x] 4.4 Drop palette : dépôt dans la colonne sélectionnée (`selectedCol`), highlight de la colonne
- [x] 4.5 Edges hérités invalides : style orange distinct (mode grille), exécution non affectée
- [x] 4.6 `BlockNode` : style carte kanban en mode grille (largeur fixe, handles gauche/droite)

## 5. Header : bascule + dropdown colonne

- [x] 5.1 Bouton de bascule « Vue libre / Vue colonnes » dans le header de l'éditeur
- [x] 5.2 Dropdown (⋮) sur l'en-tête de colonne : Dupliquer / Supprimer / Déplacer vers ► (sous-menu) + renommage inline au clic sur le label
- [x] 5.3 `toServerPayload` : `position = {x, y, col, row}` + `columns` ordonnée

## 6. Vérification

- [x] 6.1 Suite backend : `uv run python -m pytest` (nouveau test columns + régression, 98 existants)
- [x] 6.2 Smoke navigateur : bascule libre↔grille sans perte, création/renommage/duplication/déplacement de colonnes, connect refusé, déplacement cassant des liens (suppression + toast + Ctrl+Z restaure), drop palette dans la colonne sélectionnée, pipeline existant (x/y) migré à la volée
- [x] 6.3 Nettoyage des pipelines de test créés pendant les smokes (DELETE via API)
