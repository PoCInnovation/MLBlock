# Design Doc — Paramètres des sous-blocs & Segmentation des blocs compatibles

**Date :** 2026-10-25  
**Auteur :** Assistant MLBlock & User  
**Statut :** Validé  

## 1. Contexte & Objectif

MLBlock propose deux niveaux d'abstraction :
1. **Les SuperBlocks** : conteneurs prêts à l'emploi (macro 1/2/3) regroupant des sous-blocs par défaut.
2. **Les Blocs élémentaires** : briques modulaires fines.

Actuellement :
1. **Paramètres des sous-blocs** : dans l'Inspecteur (`NodeInspector`), l'utilisateur peut seulement cocher/décocher l'inclusion d'un sous-bloc. Bien que le générateur de code backend (`generator.py`) sache lire `child.params`, l'UI ne permet pas d'éditer les hyperparamètres individuels de ces sous-blocs (ex: `epochs`, `learning_rate`, `kernel_size`, etc.).
2. **Blocs suivants compatibles** : lorsqu'on clique sur une sortie (`out_1`), `CompatSheet` liste les blocs compatibles en mélangeant sans distinction les SuperBlocks et les blocs élémentaires.

L'objectif de cette évolution est :
- Permettre à l'utilisateur de déplier et modifier les paramètres de n'importe quel sous-bloc inclus dans un SuperBlock directement dans l'Inspecteur.
- Scinder la liste des « Blocs suivants » en deux catégories visuelles claires : **SuperBlocks** et **Blocs**.

## 2. Architecture & Choix Techniques

### 2.1 Segmentation des Blocs Compatibles (`utils/superblocks.ts` & `CompatSheet.tsx`)

`compatibleBlocks` partitionne les candidats en deux groupes étanches selon leur présence dans `catalog.superblocks` :
```typescript
export type CompatibleBlocksPartition = {
  superblocks: { compatible: string[]; convertible: string[] }
  blocks: { compatible: string[]; convertible: string[] }
}
```
Dans `CompatSheet` :
- Deux sections hiérarchiques distinctes avec en-tête et compteur :
  - **SuperBlocks** (`superblocks.compatible` puis `superblocks.convertible`)
  - **Blocs** (`blocks.compatible` puis `blocks.convertible`)
- Chaque carte garde son rendu unifié (`BlockCard`) avec mention explicite `· adaptateur automatique` si conversion requise.

### 2.2 Édition des Paramètres de Sous-blocs (`useAppStore.ts` & `FlowCanvas.tsx`)

1. **State Store (`useAppStore.ts`)** :
   Ajout de la méthode d'action :
   ```typescript
   updateChildParam: (nodeId: string, childType: string, k: string, v: unknown) => void
   ```
   Met à jour `child.params[k] = v` sur le nœud ciblé dans `flowNodes.data.children`, crée un point d'annulation (`commitUndoPoint`) et déclenche le recalcul du statut dirty / sauvegarde.

2. **Inspecteur UI (`FlowCanvas.tsx:NodeInspector`)** :
   - Pour chaque sous-bloc présent et coché dans `children`, si `catalog.blocks[childType].segs` comporte des paramètres éditables (`s.t !== 'text'`), un accordéon dépliable est affiché.
   - Au dépliage, affichage de `<BlockSegments>` branché sur :
     - `segs` du bloc enfant
     - `fields = child.params`
     - `onUpdate = (_id, k, v) => updateChildParam(selected.id, childType, k, v)`
     - `columnOptions` transmis depuis le nœud amont.

3. **Génération de code & Persistance** :
   - Côté frontend : `toServerPayload()` sérialise déjà fidèlement `child.params`.
   - Côté backend : `generator.py` génère déjà `k=v` à partir de `child.params`. Aucun changement backend de structure requis.
