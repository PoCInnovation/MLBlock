## Context

Le canvas ReactFlow est contrôlé par le store zustand : `flowNodes`/`flowEdges` (Node/Edge ReactFlow), mutés par `applyFlowNodeChanges`/`applyFlowEdgeChanges` (appelés en continu pendant un drag via `onNodesChange`/`onEdgesChange`), `addFlowNode` (drop/conversion), `addFlowEdges` (connect), `updateFlowParam` (paramètres — appelé à CHAQUE frappe dans BlockSegments), `setProjectName` (commit au Enter/blur), `loadPipeline` (ouverture/import). `fingerprintOf({flowNodes, flowEdges, projectName})` vs `savedFingerprint` pilote `isDirty()` et le bouton Sauvegarder (save-state-indicator).

Le risque central : ReactFlow et les champs de paramètres émettent des mutations **en continu** — un snapshot par changement rendrait l'historique inutilisable.

## Goals / Non-Goals

**Goals:**
- Annuler/rétablir tous les gestes d'édition : drag, ajout, suppression, connexion, conversion, paramètres, nom du projet.
- Boutons (header) + raccourcis clavier (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y).
- Cohérence avec `isDirty()`/fingerprint : l'état restauré recalcule naturellement l'état de sauvegarde.

**Non-Goals:**
- Zoom/pan du viewport (géré localement par ReactFlow, pas une mutation du pipeline).
- Persistance de l'historique (mémoire uniquement — le stash existant couvre la récupération de session).
- Undo des interactions avec le backend (save, import/export).

## Decisions

### D1 — Snapshots ReactFlow directs dans une pile + index
`history: Array<{nodes: Node[]; edges: Edge[]; name: string}>` (max 50) + `historyIndex`. Restore = `set()` direct (`flowNodes`, `flowEdges`, `projectName`) — les métadonnées temporaires (`measured`, `selected`) sont recalculées par ReactFlow au rendu. Les `data.fields` sont déjà des `Record<string,string>` sérialisables (JSON-clone léger au push).
*Alternative* : snapshots au format sémantique PipelineNode/PipelineEdge + reconstruction via `loadPipeline` — nécessite le catalog et un chemin de restore distinct ; rejeté (plus de code, même résultat).

### D2 — Commit explicite avant chaque geste (`commitUndoPoint`)
Une action store `commitUndoPoint()` push l'état courant (tronque la partie redo au-delà de l'index). Appelée depuis :
- FlowCanvas : `onNodeDragStart` (1 snapshot par geste de drag — le drag applique en continu), `onDrop`, `onConnect`, `insertConverter`, et avant un change `remove` dans `onNodesChange`/`onEdgesChange` (filtre : un seul push par rafale).
- BlockSegments : `onFocus` des champs de saisie → coalesce les frappes de `updateFlowParam` en un seul snapshot par session d'édition.
- EditorHeader : renommage (avant `commitName`), Tout effacer (avant le clear).
*Alternative* : middleware zustand `temporal` avec `pause()`/`resume()` — nécessite la lib ET la même plomberie de coalescing (drag + params) ; rejeté.

### D3 — `undo()` / `redo()` avec bornes
`undo()` : si `historyIndex > 0` → `index--` + restore. `redo()` : si `historyIndex < history.length - 1` → `index++` + restore. Les boutons sont `disabled` aux bornes. Le snapshot courant n'est PAS ré-empilé (l'état live reste à l'index courant ; un `commitUndoPoint` après undo tronque la suite — comportement standard).

### D4 — Raccourcis clavier globaux avec garde input
Hook `useUndoRedo()` monté dans EditorPage : listener `keydown` sur window. `(Ctrl|Meta)+Z` → undo ; `(Ctrl|Meta)+Shift+Z` ou `(Ctrl|Meta)+Y` → redo ; `e.preventDefault()` après application. **Garde** : si `e.target` est un `input`/`textarea`/`contentEditable`, on ignore (le navigateur gère l'undo du champ texte — sinon conflit).

### D5 — Réinitialisation sur changement de pipeline
`loadPipeline` (ouverture, import) et « Nouveau projet » réinitialisent `history`/`historyIndex` — l'historique est propre à chaque pipeline.

## Risks / Trade-offs

- **Coalescing des paramètres** : le snapshot au `onFocus` capture l'état AVANT la première frappe — mais si l'utilisateur clique dans un champ puis n'édite rien, un point d'undo « vide » est créé (undo sans effet visible). Acceptable (bouton undo cliquable une fois sans changement) — pondéré contre la complexité d'un push au premier vrai changement.
- **Taille mémoire** : 50 × (nodes+edges JSON) ≈ 50 × 1-5 Ko = < 250 Ko — négligeable.
- **`onNodesChange` remove en rafale** : suppression multiple (sélection) → plusieurs changes `remove` dans une rafale — le filtre doit pousser un seul snapshot par rafale (drapeau dans le handler).
- **Conflit avec les raccourcis navigateur** : la garde input couvre les champs ; hors champs, `preventDefault` est appelé avant que le navigateur ne réagisse.
