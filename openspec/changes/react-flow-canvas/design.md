## Context

Backend: supporte DAG complet (`Graph`, `Edge`, `topological_sort`).
Frontend: contraint au linéaire (`script: Block[]`, `edges: []`).
N8N utilise Vue Flow. Dify, Flowise, Sim Studio utilisent React Flow.
On veut les deux modes en coexistence.

## Goals / Non-Goals

**Goals:**
- Bouton "Mode avancé" dans l'éditeur pour basculer
- React Flow canvas avec nodes/edges, zoom, pan, ports
- Conversion bidirectionnelle `Block[] ↔ Node[] + Edge[]`
- Custom nodes par type de block
- Le mode linéaire actuel reste le défaut

**Non-Goals:**
- Pas de collaboration temps réel (Dify l'a, pas nous)
- Pas d'auto-layout algorithmique (on laisse l'utilisateur positionner)
- Pas de suppression du mode linéaire

## Decisions

1. **React Flow** comme bibli (pas custom canvas)
   - Standard: Dify, Flowise, Sim Studio l'utilisent
   - `useNodesState` + `useEdgesState` + `addEdge`
   - Custom `nodeTypes` par type de block

2. **Store dual-mode**
   ```ts
   editorMode: 'linear' | 'advanced'
   script: Block[]           // mode linéaire (existant)
   flowNodes: Node[]         // mode avancé (nouveau)
   flowEdges: Edge[]         // mode avancé (nouveau)
   ```

3. **Conversion automatique**
   - `linearToFlow(script, catalog)` : chaque `Block` → `Node` avec position x/y
   - `flowToLinear(nodes, edges)` : topological sort → `Block[]`
   - La conversion se fait au moment du switch de mode

4. **Custom node type**
   ```tsx
   <ReactFlow
     nodeTypes={{ block: BlockNode }}
   />
   BlockNode : Handle type="target" + paramètres + Handle type="source"
   ```

5. **Backend inchangé**
   - `POST /api/pipelines` accepte déjà nodes + edges
   - Le mode avancé envoie `nodes + edges` directement
   - Le mode linéaire continue d'envoyer `nodes + []`

## Risks / Trade-offs

- **[Bundle +200KB]** React Flow + dépendances → acceptable pour un mode avancé
- **[Complexité store]** Deux modes = plus d'états à gérer → atténuer par la conversion automatique
- **[Conversion parfaite]** `Block[]` → `Node[]` peut perdre la position si les nodes ne sont pas encore positionnés → par défaut, layout en colonne verticale

## Migration Plan

1. Phase 1 : installer React Flow, créer `FlowCanvas.tsx` et `BlockNode.tsx`
2. Phase 2 : étendre le store avec `editorMode`, `flowNodes`, `flowEdges`
3. Phase 3 : bouton de switch dans `EditorHeader.tsx`
4. Phase 4 : conversion bidirectionnelle
5. Phase 5 : brancher l'exécution (le mode avancé envoie nodes + edges au backend)
