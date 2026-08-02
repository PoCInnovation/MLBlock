## Why

L'éditeur actuel force une pipeline linéaire (Scratch-like) alors que le backend supporte déjà les DAG. L'IA et les pipelines ML ne sont pas linéaires : multi-inputs, branching, skip connections. Le frontend bloque cette expressivité. On ajoute un mode "avancé" avec React Flow, en coexistence avec le mode linéaire actuel.

## What Changes

- Ajout d'un bouton dans l'éditeur pour basculer entre mode "linéaire" (actuel) et "avancé" (React Flow)
- Nouveau canvas React Flow avec nodes positionnés librement, ports d'entrée/sortie, câbles visuels
- Le store gère les deux modes (`script: Block[]` pour linéaire, `nodes: Node[] + edges: Edge[]` pour avancé)
- Conversion bidirectionnelle entre les deux modes
- Custom nodes par type de block (load_csv, conv2d, linear, etc.)
- Le backend reste inchangé (il accepte déjà nodes + edges)

## Capabilities

### New Capabilities
- `react-flow-canvas`: React Flow canvas avec nodes/edges, custom nodes, ports, zoom/pan
- `editor-mode-toggle`: Bouton pour basculer entre mode linéaire et avancé

### Modified Capabilities

<!-- Aucune spec existante modifiée -->

## Impact

- **Frontend**: `reactflow` comme dépendance, nouveau composant `FlowCanvas.tsx`, custom nodes, store étendu
- **Backend**: Aucun changement
- **Bundle**: +~200KB (React Flow)
- **Migration**: conversion automatique `Block[]` → `Node[] + Edge[]` et inversement
