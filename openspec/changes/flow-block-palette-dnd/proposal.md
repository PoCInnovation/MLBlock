## Why

Le mode avancé (React Flow) affiche le canvas mais n'a pas de palette de blocks par catégorie ni de drag-and-drop. L'utilisateur ne peut pas ajouter de blocks. Le mode linéaire a déjà une palette (sidebar avec catégories). Le mode avancé doit avoir la même capacité pour être utilisable.

## What Changes

- Ajout d'une sidebar palette dans le mode avancé, listant les blocks par catégorie (réutiliser le catalogue déjà chargé)
- Drag-and-drop des blocks depuis la palette vers le canvas React Flow (position libre au point de drop)
- Création d'un node React Flow au drop avec les paramètres du block
- Cohérence visuelle avec le thème existant (`theme.ts`, couleurs des catégories du backend)

## Capabilities

### New Capabilities
- `flow-block-palette`: Sidebar palette par catégorie dans le mode avancé
- `flow-drag-and-drop`: Drag des blocks palette → canvas React Flow

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: nouveau composant `FlowPalette.tsx` (sidebar), modification de `FlowCanvas.tsx` (drag-drop handlers), réutilisation de `useAppStore` (catalog, addBlock)
- **Aucun changement backend**
- **UI/UX**: palette réutilise le pattern du mode linéaire (CategoryBar + BlockPalette) adapté au dark theme

## Référence skill ui-ux-pro-max

Recommandations appliquées :
- **Hover states** : cursor-pointer + changement visuel subtil (150-300ms) sur les items de palette
- **Feedback** : confirmation visuelle au drop (node apparaît + sélection)
- **Touch spacing** : gap 8px minimum entre items de palette
- **Couleurs** : utiliser les couleurs de catégories du backend, pas de nouveaux hex en dur (theme.ts)
