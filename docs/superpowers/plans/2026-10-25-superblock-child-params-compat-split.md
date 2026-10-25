# SuperBlock Child Params & Compat Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre l'édition des paramètres des sous-blocs d'un SuperBlock dans l'Inspecteur et segmenter la sheet des blocs compatibles en deux catégories distinctes ("SuperBlocks" et "Blocs").

**Architecture:** Le store Zustand enrichit la gestion des nœuds conteneurs avec `updateChildParam` pour modifier `child.params` dans `node.data.children` avec support undo/redo. L'Inspecteur (`NodeInspector`) intègre un accordéon pliable réutilisant `<BlockSegments>` pour chaque sous-bloc inclus. La fonction `compatibleBlocks` et la vue `CompatSheet` partitionnent les blocs compatibles en deux sections explicites : SuperBlocks et Blocs simples.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, Base UI / Lucide, Vitest, Pytest.

**Spec:** `docs/superpowers/specs/2026-10-25-superblock-child-params-compat-split-design.md`

## Global Constraints

- Respect strict de l'immutabilité du store Zustand et de l'historique undo/redo (cap 50).
- Zéro régression sur la sérialisation des pipelines (`toServerPayload`) et la génération de code Python backend.
- Aucune couleur brute ni classe personnalisée hors du design system (`theme.ts`, tokens `--color-*`, Base UI).
- Tests obligatoires : vitest côté frontend et pytest côté backend pour chaque incrément.

## Review Focus

1. **Sous-bloc décoché puis recoché** : restaurer les valeurs par défaut sans conserver d'état orphelin corrompu.
2. **Sous-bloc sans paramètres modifiables** (ex: `flatten_layer` ou `relu_layer` sans options) : ne pas afficher d'accordéon vide ni de bouton dépliable inutile.
3. **Paramètre de sous-bloc avec type numérique / booléen** : s'assurer que la conversion en chaîne requise par `BlockSegments` ne casse pas la sérialisation dans `child.params`.
4. **Port de sortie ne disposant que de blocs simples compatibles (aucun SuperBlock)** : `CompatSheet` doit masquer la section vide proprement sans message d'erreur trompeur.
5. **Génération de code backend avec un sous-bloc dont la valeur a été modifiée par l'utilisateur** : la valeur modifiée doit apparaître verbatim dans le script Python émis à la place de la valeur par défaut.

---

### Task 1: Partition des Blocs Compatibles (SuperBlocks vs Blocs) dans `utils/superblocks.ts`

**Files:**
- Modify: `frontend/src/utils/superblocks.ts:158-185`
- Test: `frontend/src/utils/superblocks.test.ts:65-85`

**Interfaces:**
- Consumes: `InternalCatalog`, `classifyEdge`, `buildConversionGraph`
- Produces: `compatibleBlocks(catalog: InternalCatalog, outDtype: string, exclude?: string): { superblocks: { compatible: string[]; convertible: string[] }; blocks: { compatible: string[]; convertible: string[] } }`

- [ ] **Step 1: Write the failing tests in `frontend/src/utils/superblocks.test.ts`**

Ajouter les assertions testant la structure partitionnée `{ superblocks, blocks }` dans `describe('compatibleBlocks')` :

```typescript
describe('compatibleBlocks', () => {
  it('partitionne les résultats entre superblocks et blocks élémentaires', () => {
    const res = compatibleBlocks(catalog, 'pd.DataFrame')
    expect(res).toHaveProperty('superblocks')
    expect(res).toHaveProperty('blocks')
    expect(Array.isArray(res.superblocks.compatible)).toBe(true)
    expect(Array.isArray(res.superblocks.convertible)).toBe(true)
    expect(Array.isArray(res.blocks.compatible)).toBe(true)
    expect(Array.isArray(res.blocks.convertible)).toBe(true)
  })

  it('isole les superblocks dans superblocks et les blocs simples dans blocks', () => {
    const res = compatibleBlocks(catalog, 'pd.DataFrame')
    expect(res.blocks.compatible).toContain('standard_scaler')
    expect(res.superblocks.compatible).not.toContain('standard_scaler')
    // sequential_model est convertible depuis pd.DataFrame via df_to_tensor
    expect(res.superblocks.convertible).toContain('sequential_model')
    expect(res.blocks.convertible).not.toContain('sequential_model')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && pnpm test src/utils/superblocks.test.ts`
Expected: FAIL avec `res.blocks is undefined` ou échec de type sur `compatibleBlocks`.

- [ ] **Step 3: Implement the partitioned return type and logic in `frontend/src/utils/superblocks.ts`**

Mettre à jour `compatibleBlocks` pour identifier les SuperBlocks via `const sbIds = new Set(catalog.superblocks.map(s => s.id))` et répartir les types compatibles et convertibles dans l'objet partitionné.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && pnpm test src/utils/superblocks.test.ts`
Expected: PASS (tous les tests du fichier verts).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/superblocks.ts frontend/src/utils/superblocks.test.ts
git commit -m "feat(superblocks): partition compatibleBlocks into superblocks and blocks"
```

---

### Task 2: Affichage Segmenté dans `CompatSheet.tsx`

**Files:**
- Modify: `frontend/src/components/flow/CompatSheet.tsx:20-58`

**Interfaces:**
- Consumes: `compatibleBlocks` (retour partitionné de Task 1)
- Produces: Rendu scindé en 2 sections visuelles (`SuperBlocks` et `Blocs`) avec compteurs et sous-listes (directes / adaptateur).

- [ ] **Step 1: Mettre à jour `CompatSheet.tsx` pour consommer la structure partitionnée**

Dans `CompatSheet.tsx` :
1. Lire `lists.superblocks` et `lists.blocks`.
2. Définir le rendu d'une catégorie globale :
   - Titre de niveau 1 : `SuperBlocks` (avec badge de nombre total).
   - Cartes compatibles puis cartes convertibles (`· adaptateur`).
   - Titre de niveau 2 : `Blocs` (avec badge de nombre total).
   - Cartes compatibles puis cartes convertibles (`· adaptateur`).
3. Masquer la section si le groupe ne contient aucun élément.
4. Afficher le message d'absence global si les deux sections sont vides.

- [ ] **Step 2: Vérifier la compilation et les tests frontend**

Run: `cd frontend && pnpm test && pnpm run build`
Expected: PASS (zéro erreur TypeScript, bundle généré avec succès).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/flow/CompatSheet.tsx
git commit -m "feat(flow): render segregated superblocks and blocks in CompatSheet"
```

---

### Task 3: Action `updateChildParam` dans `useAppStore.ts`

**Files:**
- Modify: `frontend/src/store/useAppStore.ts:75-85,150-165`
- Test: `frontend/src/store/useAppStore.test.ts:200-240`

**Interfaces:**
- Consumes: `updateNodeChildren`, `commitUndoPoint`
- Produces: `updateChildParam: (nodeId: string, childType: string, k: string, v: unknown) => void`

- [ ] **Step 1: Write the failing test in `frontend/src/store/useAppStore.test.ts`**

Ajouter un test unitaire dédié dans `describe('updateChildParam')` :

```typescript
describe('updateChildParam', () => {
  it('met à jour un paramètre spécifique d\'un sous-bloc et crée un point d\'annulation', () => {
    const container = freeNode('c1', 10, 20, {
      data: {
        type: 'sequential_model',
        fields: {},
        children: [
          { id: 'c1.conv2d_layer', type: 'conv2d_layer', params: { in_channels: 1, out_channels: 32 } },
          { id: 'c1.relu_layer', type: 'relu_layer', params: {} },
        ],
      },
    })
    useAppStore.setState({ flowNodes: [container], undoStack: [], redoStack: [] })

    expect(useAppStore.getState().canUndo()).toBe(false)

    useAppStore.getState().updateChildParam('c1', 'conv2d_layer', 'out_channels', 64)

    const updatedNode = useAppStore.getState().flowNodes[0]
    const updatedChildren = (updatedNode.data as { children: { type: string; params: Record<string, unknown> }[] }).children
    expect(updatedChildren[0].params.out_channels).toBe(64)
    expect(updatedChildren[0].params.in_channels).toBe(1)
    expect(useAppStore.getState().canUndo()).toBe(true)

    // L'annulation restaure la valeur initiale
    useAppStore.getState().undo()
    const revertedNode = useAppStore.getState().flowNodes[0]
    const revertedChildren = (revertedNode.data as { children: { type: string; params: Record<string, unknown> }[] }).children
    expect(revertedChildren[0].params.out_channels).toBe(32)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && pnpm test src/store/useAppStore.test.ts`
Expected: FAIL avec `updateChildParam is not a function`.

- [ ] **Step 3: Implement `updateChildParam` in `frontend/src/store/useAppStore.ts`**

Déclarer `updateChildParam` dans `AppState` et l'implémenter :
```typescript
updateChildParam: (nodeId, childType, k, v) => {
  const state = get()
  const node = state.flowNodes.find(n => n.id === nodeId)
  if (!node) return
  const data = node.data as { children?: PipelineNode[] } | undefined
  const children = data?.children ?? []
  const child = children.find(c => c.type === childType)
  if (!child) return
  const updatedChildren = children.map(c => c.type === childType ? {
    ...c,
    params: { ...(c.params ?? {}), [k]: v },
  } : c)
  state.updateNodeChildren(nodeId, updatedChildren)
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && pnpm test src/store/useAppStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/useAppStore.ts frontend/src/store/useAppStore.test.ts
git commit -m "feat(store): add updateChildParam action with undo/redo support"
```

---

### Task 4: Édition des Paramètres de Sous-blocs dans `NodeInspector` (`FlowCanvas.tsx`)

**Files:**
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:720-760`

**Interfaces:**
- Consumes: `updateChildParam`, `<BlockSegments>`, `catalog.blocks`
- Produces: Accordéon interactif permettant d'ajuster les champs de chaque sous-bloc coché.

- [ ] **Step 1: Mettre en place l'état local d'expansion et l'intégration de `<BlockSegments>`**

Dans `NodeInspector` (`FlowCanvas.tsx`) :
1. Ajouter un état local `expandedChildren: Set<string>` pour suivre les sous-blocs dépliés.
2. Pour chaque `childType` dans `sbEntry.children` :
   - Récupérer `childDef = catalog?.blocks[childType]`.
   - Vérifier si des paramètres existent : `hasParams = childDef?.segs.some(s => s.t !== 'text')`.
   - Si `on && hasParams`, ajouter un bouton chevron (icône `ChevronDown` / `ChevronRight`) à côté du badge.
   - Si déplié, afficher un conteneur indenté avec `<BlockSegments>` :
     ```tsx
     <BlockSegments
       segs={childDef.segs}
       fields={(child.params as Record<string, string>) ?? {}}
       blockId={`${selected.id}.${childType}`}
       blockType={childType}
       onUpdate={(_id, k, v) => updateChildParam(selected.id, childType, k, v)}
       columnOptions={columnOptions}
     />
     ```

- [ ] **Step 2: Vérifier le build et le lint frontend**

Run: `cd frontend && pnpm lint && pnpm test && pnpm run build`
Expected: PASS (0 erreur de lint, tests au vert, build réussi).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/flow/FlowCanvas.tsx
git commit -m "feat(flow): allow inspecting and modifying superblock child parameters"
```

---

### Task 5: Vérification de Génération de Code Backend avec Sous-blocs Personnalisés

**Files:**
- Test: `backend/mlblock/tests/test_runtime_codegen.py`

**Interfaces:**
- Consumes: `generate_code`, `PipelineNode`
- Produces: Test de non-régression validant que les paramètres customisés des sous-blocs sont émis dans le script final.

- [ ] **Step 1: Write the test in `backend/mlblock/tests/test_runtime_codegen.py`**

Ajouter une fonction de test vérifiant la transmission des paramètres personnalisés d'un sous-bloc dans un conteneur :

```python
def test_superblock_custom_child_params_emitted():
    from mlblock.core.generator import generate_code
    from mlblock.models.pipeline import PipelineNode

    node = PipelineNode(
        id="c1",
        type="sequential_model",
        children=[
            PipelineNode(id="c1.conv2d_layer", type="conv2d_layer", params={"in_channels": 1, "out_channels": 64, "kernel_size": 5}),
            PipelineNode(id="c1.relu_layer", type="relu_layer", params={}),
        ],
    )
    code = generate_code([node], [])
    assert "nn.Conv2d(in_channels=1, out_channels=64, kernel_size=5)" in code or "out_channels=64" in code
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd backend && uv run pytest mlblock/tests/test_runtime_codegen.py -k test_superblock_custom_child_params_emitted -v`
Expected: PASS.

- [ ] **Step 3: Exécuter la suite complète de vérification**

Run: `cd backend && uv run ruff check . && uv run pytest mlblock/tests -q; cd ../frontend && pnpm lint && pnpm test && pnpm run build`
Expected: 100% PASS partout.

- [ ] **Step 4: Commit**

```bash
git add backend/mlblock/tests/test_runtime_codegen.py
git commit -m "test(codegen): verify custom superblock child parameters in generated code"
```
