## 1. Setup React Flow

- [x] 1.1 Installer `reactflow` dans `frontend/package.json`
- [x] 1.2 Créer `src/components/flow/BlockNode.tsx` — custom node React Flow
- [x] 1.3 Créer `src/components/flow/FlowCanvas.tsx` — canvas React Flow
- [x] 1.4 Créer `src/utils/flowConversion.ts` — conversion `Block[] ↔ Node[] + Edge[]`

## 2. Store dual-mode

- [x] 2.1 Étendre le store Zustand : `editorMode`, `flowNodes`, `flowEdges`, `setEditorMode`, `setFlowNodes`, `setFlowEdges`
- [x] 2.2 Ajouter les fonctions de conversion dans le store

## 3. Éditeur

- [x] 3.1 Ajouter le bouton toggle dans `EditorHeader.tsx`
- [x] 3.2 Modifier `EditorPage.tsx` pour switcher entre `Canvas` et `FlowCanvas`
- [x] 3.3 Brancher l'exécution pour le mode avancé (envoyer nodes + edges)

## 4. Vérification

- [x] 4.1 Build frontend réussi
- [x] 4.2 Tester le switch entre les deux modes
- [x] 4.3 Tester l'exécution en mode avancé avec un pipeline simple
