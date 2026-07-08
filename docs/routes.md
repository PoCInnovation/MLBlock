## Routes du serveur — entrées, sorties, params

### Modèles communs

```
PipelineNode: { id: str, type: str, params: dict, children: list[PipelineNode] }
PipelineEdge: { source: str, source_port: str, target: str, target_port: str }
```

---

### `GET /api/blocks` — Liste paginée des blocs

| | Type |
|---|---|
| **Query params** | `page: int = 1`, `size: int = 20`, `category: str \| None`, `search: str \| None` |
| **Sortie** | `Page[BlockSummary]` |
| **Bloc** | `{ type, label, category, inputs: int, outputs: int, can_build: bool }` |

---

### `GET /api/blocks/categories` — Liste des catégories

| | Type |
|---|---|
| **Entrée** | — |
| **Sortie** | `{ categories: list[str] }` |

---

### `GET /api/blocks/{type_name}` — Détail d'un bloc

| | Type |
|---|---|
| **Path param** | `type_name: str` |
| **Sortie** | `BlockDetail` |
| **Champs** | `{ type, label, category, params: dict, inputs: list[dict], outputs: list[dict], template, children_allowed, can_build, generates_class?, class_base? }` |
| **Erreur** | `404` si inconnu |

---

### `GET /api/pipelines` — Liste paginée des pipelines

| | Type |
|---|---|
| **Query params** | `page: int = 1`, `size: int = 20`, `search: str \| None` |
| **Sortie** | `Page[PipelineSummary]` |
| **Bloc** | `{ id, name, description, created_at, updated_at, node_count }` |

---

### `POST /api/pipelines` — Créer un pipeline

| | Type |
|---|---|
| **Body** | `PipelineCreate: { name: str, description: str = "", nodes: list[PipelineNode] = [], edges: list[PipelineEdge] = [] }` |
| **Sortie** | `PipelineDetail` (201) |
| **Champs** | `{ id, name, description, created_at, updated_at, node_count, nodes, edges }` |
| **Effet** | Valide le graph (types, ports, dtypes) avant insert |

---

### `GET /api/pipelines/{pipeline_id}` — Détail d'un pipeline

| | Type |
|---|---|
| **Path param** | `pipeline_id: int` |
| **Sortie** | `PipelineDetail` |
| **Erreur** | `404` si inconnu |

---

### `PUT /api/pipelines/{pipeline_id}` — Mettre à jour un pipeline

| | Type |
|---|---|
| **Path param** | `pipeline_id: int` |
| **Body** | `PipelineCreate: { name, description, nodes, edges }` |
| **Sortie** | `PipelineDetail` |
| **Effet** | Valide le graph, met à jour `updated_at` |
| **Erreur** | `404` si inconnu |

---

### `DELETE /api/pipelines/{pipeline_id}` — Supprimer un pipeline

| | Type |
|---|---|
| **Path param** | `pipeline_id: int` |
| **Sortie** | `204 No Content` |
| **Erreur** | `404` si inconnu |

---

### `POST /api/pipelines/{pipeline_id}/generate` — Générer du code

| | Type |
|---|---|
| **Path param** | `pipeline_id: int` |
| **Sortie** | `GenerateResponse: { code: str }` |
| **Effet** | Valide graph → `Graph` → `Pipeline.generate_code()` |
| **Erreur** | `404` si inconnu, `400` si pas de nodes |

---

### `POST /api/pipelines/{pipeline_id}/build` — Construire le modèle

| | Type |
|---|---|
| **Path param** | `pipeline_id: int` |
| **Sortie** | `BuildResponse: { success: bool, output_shape: list[int]?, output_values: list[list[float]]?, layer_count: int, error: str? }` |
| **Effet** | Valide → `Graph` → `Pipeline.run()` → extrait `nn.Module` → `nn.Sequential` → dummy forward |
| **Erreur** | `404` si inconnu, `400` si pas de nodes ou blocs sans BUILD |

---

### `POST /api/validate` — Valider un graph

| | Type |
|---|---|
| **Body** | `ValidationRequest: { nodes: list[PipelineNode], edges: list[PipelineEdge] }` |
| **Sortie** | `ValidationResponse: { valid: bool, errors: list[str] }` |
| **Effet** | Validation Pydantic (types, ports, dtypes) + `Graph.validate()` (cycles, nœuds) |