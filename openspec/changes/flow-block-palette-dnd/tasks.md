## 1. Palette

- [x] 1.1 Créer `src/components/flow/FlowPalette.tsx` — sidebar liste des blocks par catégorie (depuis `catalog`)
- [x] 1.2 Styling avec `theme.ts` + couleurs de catégories du backend, hover 150-300ms

## 2. Drag & drop

- [x] 2.1 Ajouter `draggable` + `onDragStart` (dataTransfer avec le type) sur les items palette
- [x] 2.2 Ajouter `onDragOver` + `onDrop` dans `FlowCanvas.tsx` avec `screenToFlowPosition()`
- [x] 2.3 Créer le node au drop (id unique, params du block depuis le catalog) et l'ajouter à `flowNodes`

## 3. Intégration

- [x] 3.1 Intégrer `FlowPalette` dans le layout du mode avancé (à côté du canvas)
- [x] 3.2 Vérifier que le node créé est connectable et déplaçable

## 4. Vérification

- [x] 4.1 Build frontend réussi
- [x] 4.2 Tester drag palette → drop canvas → node positionné
- [x] 4.3 Vérifier qu'aucun hex en dur n'est ajouté
