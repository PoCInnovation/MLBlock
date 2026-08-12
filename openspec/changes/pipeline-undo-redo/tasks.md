## 1. Store (useAppStore)

- [x] 1.1 Ajouter `history` (Array<{nodes, edges, name}>, max 50) + `historyIndex` + `commitUndoPoint()`, `undo()`, `redo()` (restore direct de flowNodes/flowEdges/projectName, troncature redo au commit)
- [x] 1.2 Réinitialiser l'historique dans `loadPipeline` (et le chemin « Nouveau projet »)
- [x] 1.3 Exposer `canUndo`/`canRedo` (dérivés pour les boutons)

## 2. Capture des gestes (FlowCanvas + BlockSegments + EditorHeader)

- [x] 2.1 FlowCanvas : `commitUndoPoint()` sur `onNodeDragStart`, `onDrop`, `onConnect`, `insertConverter`
- [x] 2.2 FlowCanvas : `onNodesChange`/`onEdgesChange` — push unique (drapeau de rafale) avant un change `remove`
- [x] 2.3 BlockSegments : `onFocus` des champs de saisie → `commitUndoPoint()`
- [x] 2.4 EditorHeader : `commitUndoPoint()` avant le renommage (commitName) et avant « Tout effacer »

## 3. Boutons + raccourcis

- [x] 3.1 EditorHeader : boutons `Undo2`/`Redo2` (lucide), `disabled` selon canUndo/canRedo
- [x] 3.2 Hook `useUndoRedo()` monté dans EditorPage : keydown global (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y), garde input/textarea/contentEditable, preventDefault
- [x] 3.3 Build frontend : `npm run build` OK

## 4. Validation

- [x] 4.1 Smoke navigateur : ajouter un bloc → undo (disparaît) → redo (réapparaît) ; boutons désactivés aux bornes ; Ctrl+Z dans un champ param ne fait pas d'undo canvas
- [x] 4.2 Commit + push dev/chedli + fast-forward main