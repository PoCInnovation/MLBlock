# Architecture Diagrams — Super-Blocks & Containers

This companion document holds the structural, sequence, and flow diagrams for `SPEC-super-blocks`.

---

## 1. Macro vs Micro Pipeline Data Flow

```text
CANVAS PRINCIPAL (Macro — Graphe de Flux 2D)
  [ DataPipeline ]  ════( DataLoader )════►  [ DeepTrainer ]  ────( metrics )────►  [ Visualizer ]
                                                  ▲
  [ SequentialModel ]  ══( nn.Module )════════════╝
         │
         ▼
TIROIR INTERNE (Micro — Recette Séquentielle 1D)
  ┌────────────────────────────────────────────────────────┐
  │  1. Conv2d (in=3, out=32, k=3)   ──► out: [32, 30, 30] │
  │  2. ReLU()                       ──► out: [32, 30, 30] │
  │  3. MaxPool2d (k=2, s=2)         ──► out: [32, 15, 15] │
  │  4. Flatten()                    ──► out: [7200]       │
  │  5. Linear (in=7200, out=10)     ──► out: [10]         │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Structural Class Diagram (Mermaid)

```mermaid
classDiagram
class useAppStore {
  +list flowNodes
  +list flowEdges
  +string savedFingerprint
  +addNode(type, pos)
  +addChildStep(parentId, stepType, params)
  +removeChildStep(parentId, stepIndex)
  +commitUndoPoint()
}

class FlowNode {
  +string id
  +string type
  +dict position
  +bool selected
}

class NodeData {
  +string label
  +string category
  +dict params
  +list children
  +list inputSlots
  +list outputSlots
}

class ChildStep {
  +string id
  +string type
  +dict params
  +int paramCount
}

class PipelineDef {
  +list nodes
  +list edges
  +validate_types_in_registry()
  +validate_edges()
}

class PipelineNode {
  +string id
  +string type
  +dict params
  +list children
  +dict position
}

class ValidationEngine {
  +validate(graph, registry)
  +topological_sort(macro_graph)
  +validate_container_children(node)
}

class CodeGenerator {
  +generate_code(pipeline_def, registry)
  +emit_sequential(node)
}

useAppStore "1" *-- "*" FlowNode : manages
FlowNode "1" *-- "1" NodeData : contains
NodeData "1" *-- "*" ChildStep : stacks in container
PipelineDef "1" *-- "*" PipelineNode : contains
PipelineNode "1" *-- "*" PipelineNode : children
ValidationEngine ..> PipelineDef : validates
CodeGenerator ..> PipelineDef : compiles
```

---

## 3. Execution & Telemetry Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant User as Utilisateur
    participant UI as FlowCanvas
    participant Store as useAppStore
    participant Runner as useBlockRunner
    participant API as FastAPI Server
    participant DB as Supabase Postgres
    participant Vast as Runner GPU
    participant RT as Supabase Realtime

    Note over User, UI: Conception dans le Conteneur
    User->>UI: Ajoute couche Conv2d dans le tiroir
    UI->>Store: addChildStep(modelId, conv2d_layer)
    Store->>UI: Recalcule shapes et met a jour le badge

    Note over User, DB: Validation et Sauvegarde
    User->>UI: Clique Lancer
    UI->>Runner: executePipeline()
    Runner->>Store: toServerPayload() avec children
    Runner->>API: POST /api/pipelines/validate
    API->>API: ValidationEngine.validate()
    API-->>Runner: valid=true

    Note over Runner, Vast: Codegen et Deploiement GPU
    Runner->>API: POST /api/pipelines/id/run
    API->>API: CodeGenerator.generate_code()
    API->>DB: INSERT INTO jobs
    API->>Vast: Provisionne conteneur GPU
    Vast-->>API: 202 Accepted

    Note over Vast, RT: Streaming Temps Reel des Metriques
    Vast->>Vast: Execution du script inlined nn.Sequential
    loop Chaque Epoque
        Vast->>API: POST /api/jobs/id/output
        API->>DB: INSERT INTO job_outputs
        DB->>RT: Notification INSERT CDC
        RT-->>Runner: Event payload
        Runner->>Store: updateLiveMetrics()
        Store->>UI: Met a jour les courbes du Trainer
    end
```
