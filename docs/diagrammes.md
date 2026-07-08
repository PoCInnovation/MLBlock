# Diagrammes MLBlock

## 1. Diagramme de Séquence — Exécution complète

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant CLI as __main__.py
    participant REG as blocks/registry.py
    participant BLK as Block Files (.py)
    participant CFG as ConfigLoader
    participant GPH as Graph
    participant PL as Pipeline
    participant GEN as CodeGenerator
    participant BLD as BlockMeta/BUILD

    Note over U,BLD: ═══ PHASE 1: Démarrage & Auto-découverte ═══

    CLI->>REG: import mlblock.blocks.registry
    REG->>REG: _discover(): parcourt blocks/*/*.py

    loop Pour chaque fichier .py
        REG->>BLK: importlib.import_module(block)
        BLK-->>REG: module.BLOCK (dict metadata)
        BLK-->>REG: module.BUILD (fonction)
        REG->>REG: BlockRegistry.register(name, BLOCK, BUILD)
    end

    Note over REG: 53 blocs enregistrés avec BLOCK + BUILD

    Note over U,BLD: ═══ PHASE 2: Chargement config JSON ═══

    U->>CLI: python -m mlblock config.json --mode build
    CLI->>CFG: ConfigLoader(path, registry)
    CFG->>CFG: .load() → parse JSON
    CFG->>CFG: .validate(graph_data)

    Note over CFG: Vérifie: nodes/edges existent<br/>chaque node a id + type valide<br/>ports et dtypes compatibles

    Note over U,BLD: ═══ PHASE 3: Construction du graphe ═══

    CLI->>GPH: Graph(graph_data)
    GPH->>GPH: GraphNode(id, type, params) × N
    GPH->>GPH: Edge(src, port) × M
    GPH->>GPH: topological_sort() → ordre exécution

    Note over U,BLD: ═══ PHASE 4: Pipeline ═══

    CLI->>PL: Pipeline(graph)
    alt Mode --generate
        PL->>GEN: generate_code()
        loop Pour chaque nœud (ordre topo)
            GEN->>GEN: résout {params.x} → valeur
            GEN->>GEN: résout {input.x} → var amont
            GEN->>GEN: résout {output.x} → nom variable
            GEN->>GEN: extrait les imports
        end
        GEN->>GEN: assemble def main(): + imports
        GEN-->>PL: code Python (str)
        PL-->>CLI: code généré
        CLI-->>U: print(code)
    else Mode --build
        PL->>PL: run()
        loop Pour chaque nœud (ordre topo)
            PL->>PL: collecte _inputs depuis nœuds amont
            PL->>PL: injecte _inputs dans params
            PL->>BLD: execute(params)
            BLD->>BLK: BUILD(params)  ← vraie fonction Python
            BLK-->>BLD: {"port": objet}  (ex: nn.Module, DataFrame)
            BLD-->>PL: result
            PL->>PL: stocke outputs[node_id]
        end
        PL-->>CLI: outputs (dict)
        CLI->>CLI: nn.Sequential(*layers) + dummy forward
        CLI-->>U: Modèle construit : shape + valeurs
    end
```

## 2. Diagramme de Séquence — Focus Build (détail d'un bloc)

```mermaid
sequenceDiagram
    participant PL as Pipeline.run()
    participant N as GraphNode
    participant BM as BlockMeta
    participant B as BUILD(params)

    Note over PL,B: Exemple: linear_regression bloc

    PL->>N: récupère le nœud (ordre topo)
    PL->>PL: collecte _inputs depuis amont
    Note over PL: _inputs = {"train_data": DataFrame}

    PL->>N: node.params["_inputs"] = inputs
    PL->>BM: execute(params)

    BM->>BM: params.pop("_inputs") → inputs

    rect rgb(240, 255, 240)
        Note over BM,B: Appel à la vraie fonction Python
        BM->>B: BUILD(params)
        B->>B: data = params["_inputs"]["train_data"]
        B->>B: X = data.drop(target); y = data[target]
        B->>B: model = LinearRegression().fit(X, y)
        B-->>BM: {"model": <trained_model>}
    end

    BM->>BM: si dict → return direct<br/>sinon → wrap dans {first_output: value}
    BM-->>PL: {"model": <sklearn_model>}

    PL->>PL: stocke outputs["regression"] = result
    Note over PL: ↓ bloc suivant reçoit:<br/>_inputs = {"model": <trained_model>}
```

## 3. Diagramme de Flux — Auto-découverte

```mermaid
flowchart TD
    A[python -m mlblock] --> B[import mlblock.blocks.registry]
    B --> C[_discover()]
    C --> D{parcourt blocks/*/*.py}
    D --> E[neural/linear.py]
    D --> F[neural/conv2d.py]
    D --> G[neural/...]
    D --> H[data/load_csv.py]
    D --> I[rl/train_rl.py]
    D --> J[models/random_forest.py]

    E --> K{has BLOCK ?}
    K -->|oui| L{has BUILD ?}
    L -->|oui| M[register(name, BLOCK, BUILD)]
    L -->|non| N[register(name, BLOCK, None)]

    M --> O[BlockRegistry._blocks]
    N --> O

    O --> P[53 blocs indexés]
    P --> Q[ConfigLoader.validate]
    Q --> R[Graph.build]
    R --> S[Pipeline]
    S --> T{--mode ?}
    T -->|generate| U[CodeGenerator]
    T -->|build| V[Pipeline.run → BUILD]
```
