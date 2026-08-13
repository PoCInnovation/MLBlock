## Context

- L'éditeur est un canvas React Flow (v11) avec store Zustand (`useAppStore.ts`, 350 lignes) : `flowNodes: Node[]` (position libre x/y), `flowEdges: Edge[]`, undo/redo par snapshots ReactFlow complets (50 max), commit à chaque `onNodeDragStart`, fingerprint JSON (inclut `position`), sauvegarde manuelle (bouton + `savedFingerprint`/`isDirty`), backfill des segs via `setCatalog`.
- `FlowCanvas.tsx` (252 lignes) : `onConnect` avec validation de types de ports (`srcDtype/tgtDtype`), drag palette→canvas via `screenToFlowPosition`, pan/zoom actifs.
- Serveur : `PipelineNode.position: dict[str, float] | None` — stocké tel quel (dict opaque) ; `PipelineDef` = name, description, is_draft, nodes, edges. Le moteur (topo sort Kahn, run séquentiel) est agnostique du layout.
- UI : React 18, Tailwind, `@base-ui/react` (primitives), `lucide-react` (icônes).

## Goals / Non-Goals

**Goals:**
- Second design « vue grille » switchable, sans toucher au mode libre existant.
- Position discrète (colonne/rangée) → fingerprint stable, undo 1 commit/geste, chemin vers l'autosave.
- Règle `colonne(cible) > colonne(source)` → acyclicité par construction, indépendance intra-colonne (base parallélisation future).
- Gestion libre des colonnes (création, renommage, duplication, suppression, réordonnancement) via dropdown.
- Zéro changement du moteur d'exécution ; serveur quasi inchangé.

**Non-Goals:**
- Autosave (bouton manuel conservé).
- Parallélisation réelle de l'exécution (le run reste séquentiel ; la règle de liens rend la parallélisation future possible).
- Montée de version React Flow (rester en v11).
- Migration de données existantes (conversion à la volée au passage en grille).

## Decisions

### D1. Deux représentations coexistent dans `position`
`position` côté serveur devient `{x, y, col?, row?}`. Le mode libre lit `x/y` (col/row ignorés), le mode grille lit `col/row` et **dérive** `x/y` pour le rendu React Flow. Le switch est non destructif : au premier passage en grille, `col = round(x / COL_W)`, `row = round(y / ROW_H)` calculés à la volée. Le fingerprint couvre x/y **et** col/row : en mode libre col/row est stable (pas de faux dirty), en mode grille x/y est dérivé donc stable.
- *Alternative rejetée* : stocker col/row dans `params` (pollue les paramètres métier) ; stocker seulement col/row (perd le layout libre au retour).

### D2. `columns` sur le pipeline (serveur)
`PipelineDef.columns: list[{id, label}] | None = None` — liste **ordonnée**, l'index = position. Absence → colonne unique « 0 » (rétrocompat). Seul changement backend ; `test_position_roundtrip` reste vert.

### D3. Vue grille = React Flow contraint, pas une nouvelle lib
Pan/zoom conservés (les deux modes). Les colonnes sont dessinées dans un `Background` custom (suit le viewport). Le drag reste natif React Flow ; le snap se fait au `onNodeDragStop` : position → `col = round(x/W)`, `row = round(y/H)` → réécriture de `position` (x/y dérivés + col/row). Handles gauche/droite en mode grille (style pipeline CI).

### D4. Règle de liens — trois comportements, un invariant
Invariant : `colonne(cible) > colonne(source)`.
- **Connect** : refus + toast (geste de création, validé à la source).
- **Déplacement de bloc ou de colonne** : **jamais bloqué** — les liens devenus invalides sont supprimés + toast « N lien(s) retiré(s) — Ctrl+Z ». 1 commit undo avant le geste (dragStop, avant la suppression) → tout est réversible.
- **Liens hérités invalides** (migration, ou cas résiduels) : style orange, non bloquant, run OK (le moteur fait son topo sort).
- *Alternative rejetée* : warning orange sur déplacement (état visuel de plus, comportement incohérent entre gestes).

### D5. Colonnes gérables via dropdown (⋮ sur l'en-tête)
Menu (Base UI DropdownMenu + icône lucide) :
- **Dupliquer** : copie la colonne + ses blocs (nouveaux ids, `fields` copiés, **aucun lien**).
- **Supprimer** : colonne vide → suppression + décalage ; colonne pleine → refus « déplace ses blocs d'abord ».
- **Déplacer vers ►** : sous-menu des autres colonnes → retrait + insertion à l'index choisi (réordonnancement).
- **Renommer** : clic sur le label → input inline ; défaut auto-incrémenté « 0, 1, 2… » (compteur = index courant, jamais réutilisé).

### D6. Drop palette → colonne sélectionnée
`selectedCol` dans le store ; la colonne sélectionnée est highlightée (couleur de la palette des catégories, réutilisée). Le drop existant (`screenToFlowPosition`) → `col = floor(x / W)`, `row = fin de pile`.

### D7. Undo/redo allégé
Le commit passe de `onNodeDragStart` à `onNodeDragStop` (et seulement si col/row a changé). La structure des snapshots (`UndoSnapshot = {nodes, edges, name}`) est conservée — le poids perçu (fréquence des commits) disparaît sans changer le mécanisme. Snapshots « minces » (col/row + fields au lieu des `Node[]` ReactFlow) = optimisation ultérieure, non requise pour la garantie de la change.

### D8. Store : champ `viewMode`
`viewMode: 'free' | 'grid'` + `selectedCol: string | null` + `columns: {id, label}[]` dans `AppState`. La préférence de vue peut être persistée en localStorage (optionnelle, non bloquante). La bascule ne modifie aucune donnée de pipeline.

## Risks / Trade-offs

- **Arrondi de migration** : col/row dérivés de x/y peuvent produire des liens backward par accident d'arrondi → couvert par le style orange (D4), non bloquant.
- **Suppression de liens en masse** (déplacement de colonne) : hostile si non annoncé → toast avec compteur + undo obligatoire avant le geste.
- **Background custom** : les colonnes doivent suivre le viewport (pan/zoom) — mécanisme React Flow standard (`Background`), à valider en spike avant l'implémentation complète.
- **Deux designs à maintenir** : le mode libre reste intact (aucun refactor de son chemin de code), le code grille s'ajoute à côté — risque de duplication UI faible car les deux modes partagent `BlockNode` et le store.
- **Base UI DropdownMenu** : vérifier la disponibilité du composant dans `@base-ui/react` (fallback : menu maison léger).
