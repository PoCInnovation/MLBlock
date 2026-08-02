## Context

Le mode avancé (React Flow) est opérationnel mais vide : pas de palette pour ajouter des blocks, pas de drag-and-drop. Le store a déjà `catalog` (categories + blocks) et `flowNodes`/`flowEdges`. React Flow fournit `useReactFlow().screenToFlowPosition()` pour placer un node au point du drop.

## Goals / Non-Goals

**Goals:**
- Sidebar palette par catégorie dans le mode avancé
- Drag depuis la palette → drop sur le canvas → nouveau node positionné
- Node initialisé avec les params du block
- Cohérence avec le thème existant

**Non-Goals:**
- Pas de drag pour réordonner les nodes existants (React Flow le fait nativement)
- Pas de connection entre nodes dans cette change (déjà possible nativement)
- Pas de suppression/reconnexion UI custom

## Decisions

1. **Composant `FlowPalette.tsx`** — sidebar à gauche, réutilise le catalogue
   - Réutilise `CategoryBar` + `BlockPalette` existants (pattern du mode linéaire)
   - Ou un composant plus léger dédié au mode flow
   - Items : label du block, drag-handle

2. **Drag avec `dataTransfer`** (HTML5 drag) ou pointer-events
   - HTML5 DnD : `draggable` sur les items palette, `onDragStart` set `type` dans `dataTransfer`
   - React Flow : `onDrop` + `screenToFlowPosition()` sur le canvas
   - Simpler que pointer-events custom — React Flow gère déjà le drop natif

3. **Nouveau node au drop**
   ```ts
   const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
   const node = {
     id: `${type}_${Date.now()}`,
     type: 'block',
     position,
     data: { label, category, categoryColor, params },
   }
   setFlowNodes(nds => [...nds, node])
   ```

4. **Paramètres du node** : extraire du catalogue (`catalog.blocks[type]`) comme dans le mode linéaire (`instantiate`)

5. **Thème** : utiliser `theme.ts` + `colorFor(cat, categories)` existant. Aucun hex en dur.

## Risks / Trade-offs

- **[Drag HTML5 limité]** Pas de custom ghost, dépend du navigateur → acceptable pour MVP
- **[Drop position]** `screenToFlowPosition` doit être appelé après que le wrapper React Flow est prêt → le faire dans `onDrop` du canvas

## Migration Plan

1. Créer `FlowPalette.tsx` (sidebar, liste par catégorie)
2. Ajouter les handlers `onDragOver`/`onDrop` dans `FlowCanvas.tsx`
3. Câbler la création de node dans le store
4. Tester drag depuis palette → drop → node positionné
