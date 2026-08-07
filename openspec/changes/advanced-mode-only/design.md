## Context

Le store porte deux représentations : `script: Block[]` (linéaire) et `flowNodes/flowEdges` (React Flow), reliées par `linearToFlow`/`flowToLinear`. `EditorPage` rend `EditorLayout` ou `FlowCanvas` selon `editorMode` (persisté localStorage). Le run linéaire envoie `edges: []` (pas de connexions réelles). L'inventaire des touchpoints : store (8), EditorPage (2), EditorHeader (2), useBlockRunner (2), blockHelpers.toServerPayload (branche linéaire), flowConversion (2 fonctions), 10 composants linéaires.

## Goals / Non-Goals

**Goals:**
- `flowNodes`/`flowEdges` comme unique représentation du canvas
- Supprimer tout le code mort linéaire (état, actions, composants, conversions)
- L'éditeur s'ouvre directement en avancé ; ouverture des projets inchangée (positions)
- Garde non-sauvegardé, run, save, import/export fonctionnels sur le flow uniquement

**Non-Goals:**
- Refonte UX de la palette avancée (elle devient la palette unique, telle quelle)
- Changement du format JSON stocké (nodes/edges/position — déjà le format serveur)
- Migration de données (aucune : le serveur stocke déjà nodes/edges)

## Decisions

### D1 — Le store devient flow-only
- Supprimer : `editorMode`, `script`, `savedMode` (localStorage), `setEditorMode`, `addBlock`, `deleteBlock`, `moveBlock`, `updateField`.
- Garder : `flowNodes`, `flowEdges` + actions flow (`addFlowNode`, `applyFlowNodeChanges`, `applyFlowEdgeChanges`, `addFlowEdges`, `updateFlowParam`, `removeFlowNode`).
- `clearAll` : ne vide plus `script`.

### D2 — loadPipeline sans script intermédiaire
Construire les nodes React Flow directement depuis le JSON serveur (le mapping actuel de `linearToFlow` — type, label, category, categoryColor, segs, fields, inputs, outputs — appliqué sans passer par `Block[]`), avec les positions serveur ou l'auto-layout fallback (x: 100, y: 80 + i*120). Le backfill `setCatalog` (reconversion one-shot) devient inutile : le catalog n'est plus requis pour construire le script — MAIS il l'est pour les segs/inputs/outputs des nodes. Le backfill reste donc nécessaire pour les nodes chargés avant le catalog (même logique, appliquée aux flowNodes déjà construits sans catalog : reconstruire les data.segs quand le catalog arrive si les nodes n'ont pas de segs).

### D3 — toServerPayload flow-only
Supprimer la branche linéaire : nodes depuis `flowNodes` (type/fields/position), edges depuis `flowEdges`. La garde « Aucun bloc » du runner passe sur `flowNodes.length === 0`.

### D4 — Composants supprimés
`EditorLayout`, `Canvas`, `HatBlock`, `ScriptBlock`, `ChainConnector`, `BlockPalette`, `CategoryBar`, `CategoryIcon`, `PaletteBlock` (définitivement) ; `useDragDrop` réduit ou supprimé selon ses usages résiduels ; `flowToLinear` supprimé, `linearToFlow` remplacé par la construction directe (D2). `BlockSegments` reste (utilisé par BlockNode). `EditorPage` rend toujours `FlowCanvas`.

### D5 — Fingerprint et persistance
`isDirty()` compare `{flowNodes, flowEdges, projectName}`. La clé localStorage `mlblock-editor-mode` n'est plus lue/écrite (nettoyage optionnel de la clé au boot). Le header perd le toggle Avancé/Linéaire.

## Risks / Trade-offs

- **Ouverture d'un projet avant le catalog** : les nodes sans segs s'affichent sans params jusqu'au backfill — comportement déjà existant, conservé.
- **Suppression de fichiers** : risque d'imports orphelins — `tsc --noEmit` + build les détectent ; vérification par grep des références après suppression.
- **UX palette** : le clic-simple pour ajouter (linéaire) disparaît — l'ajout se fait par drag depuis FlowPalette (déjà le cas en avancé).
- **Régressions** : smoke complet après la suppression (ouvrir projet, ajouter bloc, run, save, import/export, garde non-sauvegardé).
