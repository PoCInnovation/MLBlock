## 1. Store — flow-only

- [x] 1.1 Supprimer `editorMode`, `script`, `savedMode` (localStorage), `setEditorMode`, `addBlock`, `deleteBlock`, `moveBlock`, `updateField` ; `clearAll` sans `script`
- [x] 1.2 `loadPipeline` : construction directe des nodes flow (sans `script`) avec positions/auto-layout
- [x] 1.3 `setCatalog` : backfill des nodes chargés avant le catalog (segs/inputs/outputs)
- [x] 1.4 Fingerprint `isDirty()` : `{flowNodes, flowEdges, projectName}` ; suppression de la lecture de `mlblock-editor-mode`

## 2. Runner & payload

- [x] 2.1 `toServerPayload` : branche flow uniquement
- [x] 2.2 `useBlockRunner` : garde « Aucun bloc » sur `flowNodes.length === 0`, suppression de la branche linéaire

## 3. Composants

- [x] 3.1 `EditorPage` : rend `FlowCanvas` toujours ; `EditorHeader` sans toggle (bouton Avancé/Linéaire retiré)
- [x] 3.2 Supprimer `EditorLayout`, `Canvas`, `HatBlock`, `ScriptBlock`, `ChainConnector`, `BlockPalette`, `CategoryBar`, `CategoryIcon`, `PaletteBlock`
- [x] 3.3 `flowConversion` : supprimer `flowToLinear` (+ `linearToFlow` si non réutilisé) ; `useDragDrop` réduit/supprimé selon usages résiduels ; vérif imports orphelins (tsc + grep)

## 4. Vérification

- [x] 4.1 Build (`tsc --noEmit && vite build`) + grep zéro référence linéaire (`editorMode`, `script`, `linearToFlow`, `BlockPalette`, `EditorLayout`)
- [x] 4.2 Smoke navigateur : ouverture éditeur (avancé direct) ; ouvrir projet (positions) ; ajouter bloc (drag palette) ; run local ; sauvegarde ; import/export ; garde non-sauvegardé ; refresh
