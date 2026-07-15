# MLBlock v1 — Architecture

**Le Scratch de l'IA.** Plateforme pour apprendre et expérimenter le ML en assemblant des blocs visuels.

---

## Vision

L'utilisateur dessine un DAG de blocs ML dans une interface visuelle → le backend assemble les fonctions Python dans l'ordre → sauvegarde en base → un GPU exécute le code. Chaque bloc est une **fonction Python standard** avec docstring et type hints.

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────┐
│   Frontend SPA  │ ◀─────▶ │   Backend FastAPI             │
│   (React/Vue)   │  REST   │   POST /pipelines/save       │
│                 │         │   POST /pipelines/{id}/execute│
│   Supabase JS   │ ◀─────▶ │                              │
│   (Auth + RT)   │  WS     └──────────┬───────────────────┘
└─────────────────┘                    │
                              ┌────────▼────────┐
                              │   PostgreSQL     │
                              │   (pipelines)    │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   GPU (Vast.ai)  │
                              │   Exécution .py  │
                              └─────────────────┘
```

---

## Frontend

| Technologie | Rôle |
|---|---|
| Framework SPA (React/Vue/Svelte) | Interface visuelle DAG, éditeur de pipelines |
| Supabase JS | Auth (OAuth) + Realtime (WebSocket) |
| npm/bun | Dépendances |

### Authentification — Flow OAuth

```
User clique "Se connecter"
    │
    ▼
Supabase Auth → redirect Google/Microsoft
    │
    ▼
Callback → Supabase stocke la session
    │
    ▼
Frontend reçoit le JWT (access_token)
    │
    ▼
API calls → header Authorization: Bearer <jwt>
    │
    ▼
Backend vérifie le JWT via Supabase
```

Fournisseurs : **Google** (OAuth 2.0), **Microsoft** (OAuth 2.0 / Azure AD).

### Realtime — progression live

Le frontend s'abonne à deux tables via **Supabase Realtime** — statut global + résultats par bloc :

```typescript
// Statut global du job
const jobSub = supabase
  .channel('job-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
    (payload) => {
      setJobStatus(payload.new.status)
      if (payload.new.error) setError(payload.new.error)
    }
  )
  .subscribe()

// Résultats par bloc (un message par bloc exécuté)
const outputSub = supabase
  .channel('job-outputs')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'job_outputs', filter: `job_id=eq.${jobId}` },
    (payload) => {
      appendBlockOutput(payload.new.block_name, payload.new.output)
    }
  )
  .subscribe()
```

---

## Server

| Technologie | Rôle |
|---|---|
| FastAPI (Python) | API REST, génération de code, orchestration GPU |
| supabase-py | Client Python officiel (Auth et Storage) |
| uv | Dépendances Python |

### Principes d'architecture

1. **Server-authoritative** : le backend valide et génère le code. Le client ne run jamais la logique.
2. **State externalisé** : tout le state vit dans PostgreSQL. Le GPU est jetable.
3. **Compute éphémère** : les instances GPU sont créées et détruites. Pas d'état persistant.
4. **Realtime** : les résultats remontent en live via Supabase Realtime, pas de polling.
5. **Storage et URLs signées** : Les données volumineuses et modèles entraînés transitent par Supabase Storage. Le backend génère des URLs temporaires signées pour sécuriser les transferts sans exposer les clés d'administration au GPU.

### Modèle Pydantic — Block

from pydantic import BaseModel
from typing import Any
from uuid import UUID


class ParamInfo(BaseModel):
    type: str
    description: str = ""
    default: Any = None
    required: bool = False


class Category(BaseModel):
    name: str
    color: str


class Block(BaseModel):
    name: str
    description: str = ""
    category: Category
    params: dict[str, ParamInfo] = {}
    outputs: list[dict[str, str]] = []
    deps: list[str] = []


class Page(BaseModel):
    items: list[Block]
    total: int
    page: int
    size: int


class PipelineNode(BaseModel):
    id: str
    type: str
    params: dict[str, Any] = {}


class PipelineEdge(BaseModel):
    source: str
    source_port: str
    target: str
    target_port: str


class PipelineCreate(BaseModel):
    name: str
    description: str = ""
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]


class PipelineUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    nodes: list[PipelineNode] | None = None
    edges: list[PipelineEdge] | None = None


class PipelineDetail(BaseModel):
    id: UUID
    name: str
    description: str
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]
    code: str
    created_at: str
    updated_at: str

def _row_to_summary(row) -> dict:
    return {"id": row.id, "name": row.name, "description": row.description,
            "updated_at": row.updated_at.isoformat()}


def _row_to_detail(row, nodes: list[PipelineNode], edges: list[PipelineEdge]) -> dict:
    return {"id": row.id, "name": row.name, "description": row.description,
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges],
            "code": row.code,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat()}
```

Le frontend reçoit par exemple :

```json
{
  "name": "conv2d",
  "description": "Applies a 2D convolution over an input signal.",
  "category": {"name": "neural", "color": "#6366F1"},
  "params": {
    "x": {"type": "Tensor", "description": "Input tensor", "required": true},
    "in_channels": {"type": "int", "description": "Number of channels in the input image", "required": true},
    "out_channels": {"type": "int", "description": "Number of channels produced by the convolution", "required": true},
    "kernel_size": {"type": "int", "description": "Size of the convolving kernel", "default": 3, "required": false}
  },
  "outputs": [{"name": "out", "dtype": "Tensor"}]
}
```

Le frontend voit tous les paramètres. Pour chacun, il peut soit laisser l'utilisateur saisir une valeur, soit le connecter à la sortie (`out_N`) d'un bloc précédent si les types sont compatibles.

### Pipeline

Une pipeline est un **graphe orienté acyclique (DAG)** de blocs. Chaque bloc est un nœud du graphe, et les connexions entre blocs sont des arêtes nommées (port-based).

```
Frontend envoie :
{
  "name": "Analyse ventes",
  "nodes": [
    {"id": "n1", "type": "load_csv",          "params": {"path": "ventes.csv"}},
    {"id": "n2", "type": "train_test_split",  "params": {"target_column": "prix", "test_size": 0.2}},
    {"id": "n3", "type": "linear_regression", "params": {}}
  ],
  "edges": [
    {"source": "n1", "source_port": "out", "target": "n2", "target_port": "data"},
    {"source": "n1", "source_port": "out", "target": "n2", "target_port": "target_column"},
    {"source": "n2", "source_port": "X_train", "target": "n3", "target_port": "train_data"},
    {"source": "n2", "source_port": "y_train", "target": "n3", "target_port": "train_target"}
  ]
}
```

Chaque nœud a un `id` unique (généré par le frontend). Les arêtes relient un port de sortie (`source.source_port`) à un port d'entrée (`target.target_port`). Le serveur calcule l'ordre d'exécution par **tri topologique** du graphe.

```python
order = graph.topological_sort()  # → ["n1", "n2", "n3"]
for node_id in order:
    node = graph.nodes[node_id]
    inputs = {edge.target_port: outputs[edge.source]
              for edge in graph.edges if edge.target == node_id}
    result = node.block.execute(node.params, inputs)
    outputs[node_id] = result
```

Le code généré suit le même motif, avec des noms de variables basés sur les IDs de nœud :

```python
out_n1 = load_csv(path="ventes.csv")
out_n2_X_train, out_n2_y_train = train_test_split(data=out_n1, target_column="prix", test_size=0.2)
out_n3 = linear_regression(train_data=out_n2_X_train, train_target=out_n2_y_train)
```

Chaque variable générée suit le motif `out_{node_id}` (ou `out_{node_id}_{port_name}` pour les fonctions multi-sorties). Les paramètres utilisateur passent en kwargs, les connexions entre blocs passent via `out_{source_id}`.

### Routes

#### Aperçu

| Méthode | Route | Action | Auth |
|---|---|---|---|
| `GET` | `/blocks?page=N&category=&q=` | Liste les blocs (avec filtres optionnels) | Oui |
| `GET` | `/blocks/categories` | Liste des catégories avec nombre de blocs | Oui |
| `GET` | `/blocks/{type_name}` | Détail d'un bloc | Oui |
| `GET` | `/pipelines` | Liste les pipelines de l'utilisateur | Oui |
| `POST` | `/pipelines` | Crée une pipeline (valide, génère le `.py`, sauvegarde) | Oui |
| `GET` | `/pipelines/{id}` | Charge une pipeline (nodes + edges) | Oui |
| `PUT` | `/pipelines/{id}` | Met à jour une pipeline | Oui |
| `DELETE` | `/pipelines/{id}` | Supprime une pipeline + ses jobs | Oui |
| `POST` | `/pipelines/{id}/generate` | Preview du code généré (dry run) | Oui |
| `POST` | `/pipelines/{id}/execute` | Exécute la pipeline sur GPU Vast.ai | Oui |
| `GET` | `/pipelines/{id}/jobs` | Historique des jobs d'une pipeline | Oui |
| `GET` | `/jobs/{job_id}` | Détail d'un job (output, error, status) | Oui |
| `POST` | `/jobs/{job_id}/status` | GPU callback: met à jour le status du job | GPU key |
| `POST` | `/jobs/{job_id}/output` | GPU callback: pousse le résultat d'un bloc | GPU key |
| `POST` | `/jobs/{job_id}/error` | GPU callback: rapporte une erreur | GPU key |

#### Authentification

Toutes les routes marquées Auth = Oui nécessitent un header `Authorization: Bearer <jwt>`.
Le backend vérifie le JWT Supabase via `jose.jwt`, extrait le `sub` comme `user_id`,
et injecte ce dernier dans les handlers via `Depends(get_current_user)`.

```python
# mlblock/server/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

security = HTTPBearer()
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload["sub"]  # user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

#### GET /blocks

Filtres optionnels :
- `?category=neural` — filtre par nom de catégorie
- `?q=conv` — recherche par nom ou description (insensible à la casse)
- `?page=N` — pagination (30 par page)

```python
def list_blocks(
    page: int | None = None,
    category: str | None = None,
    q: str | None = None,
    _: str = Depends(get_current_user),
) -> list[Block] | Page[Block]:
    items = list(BLOCK_REGISTRY.values())
    if category:
        items = [b for b in items if b.category.name == category]
    if q:
        q_lower = q.lower()
        items = [b for b in items if q_lower in b.name.lower() or q_lower in (b.description or "").lower()]
    if page is None:
        return items
    size = 30
    start = (page - 1) * size
    sliced = items[start : start + size]
    return Page(items=sliced, total=len(items), page=page, size=size)
```

#### GET /blocks/categories

```python
def list_categories(
    _: str = Depends(get_current_user),
) -> list[dict]:
    counts: dict[str, dict] = {}
    for block in BLOCK_REGISTRY.values():
        cat = block.category.name
        if cat not in counts:
            counts[cat] = {"name": cat, "color": block.category.color, "block_count": 0}
        counts[cat]["block_count"] += 1
    return list(counts.values())
```

#### GET /pipelines

```python
def list_pipelines(
    user_id: str = Depends(get_current_user),
    page: int = 1,
) -> Page:
    query = select(PipelineTable).where(PipelineTable.user_id == user_id).order_by(PipelineTable.updated_at.desc())
    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    rows = session.exec(query.offset((page - 1) * 30).limit(30)).all()
    return Page(items=[_row_to_summary(r) for r in rows], total=total, page=page, size=30)
```

#### POST /pipelines

```python
def create_pipeline(
    body: PipelineCreate,
    user_id: str = Depends(get_current_user),
) -> PipelineDetail:
    # Validation handled by PipelineDef model_validators:
    #   - validate_types_in_registry: block type exists?
    #   - validate_edges: port names valid on both sides?
    #   - validate_dtype_compatibility: output dtype == input dtype?
    # Plus Graph.validate(): cycle detection + edge references
    row = PipelineTable(
        user_id=user_id,
        name=body.name,
        description=body.description or "",
        nodes=[n.model_dump() for n in body.nodes],
        edges=[e.model_dump() for e in body.edges],
        code=generate_code(body.nodes, body.edges),
    )
    session.add(row)
    session.commit()
    return _row_to_detail(row, body.nodes, body.edges)
```

#### GET /pipelines/{id}

```python
def get_pipeline(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if not row or row.user_id != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    nodes = [PipelineNode(**n) for n in row.nodes]
    edges = [PipelineEdge(**e) for e in row.edges]
    return _row_to_detail(row, nodes, edges)

#### PUT /pipelines/{id}

```python
def update_pipeline(
    pipeline_id: UUID,
    body: PipelineUpdate,
    user_id: str = Depends(get_current_user),
) -> PipelineDetail:
    row = session.get(PipelineTable, pipeline_id)
    if body.name is not None: row.name = body.name
    if body.description is not None: row.description = body.description
    if body.nodes is not None: row.nodes = [n.model_dump() for n in body.nodes]
    if body.edges is not None: row.edges = [e.model_dump() for e in body.edges]
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    nodes = [PipelineNode(**n) for n in row.nodes]
    edges = [PipelineEdge(**e) for e in row.edges]
    return _row_to_detail(row, nodes, edges)
```

#### DELETE /pipelines/{id}

```python
def delete_pipeline(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
) -> None:
    row = session.get(PipelineTable, pipeline_id)
    session.commit()
```

#### POST /pipelines/{id}/generate

Retourne le code généré sans sauvegarder (dry run pour preview).

```python
def generate_pipeline_code(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
):
    row = session.get(PipelineTable, pipeline_id)
    if not row or row.user_id != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    edges = [PipelineEdge(**e) for e in row.edges]
    code = generate_code(nodes, edges)
    return {"code": code}


#### POST /pipelines/{id}/execute

```python
import base64
import time

def execute_pipeline(
    id: UUID,
    user_id: str = Depends(get_current_user),
):
    row = session.get(PipelineTable, id)
    if not row or row.user_id != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    code = row.code
    with_args = _collect_dependencies(_blocks_used_in(row.nodes))

    vast = VastAI(api_key=os.environ["VAST_API_KEY"])
    # bookworm is glibc-compliant for scientific ML wheels (unlike alpine)
    instance = vast.launch_instance(
        gpu_name="T4", num_gpus=1,
        image="ghcr.io/astral-sh/uv:python3.13-bookworm",
        disk=10,
    )
    instance_id = instance["id"]

    job = Job(pipeline_id=id, user_id=user_id, vast_instance_id=instance_id, status="queued")
    session.add(job)
    session.commit()

    vast.start_instance(instance_id)
    # ponytail: sleep 15s le temps que l'instance boot
    time.sleep(15)

    encoded = base64.b64encode(code.encode()).decode()
    backend_url = os.environ["BACKEND_URL"]
    gpu_api_key = os.environ["GPU_API_KEY"]
    vast.execute(
        instance_id,
        f"echo '{encoded}' | base64 -d | JOB_ID={job.id} BACKEND_URL={backend_url} GPU_API_KEY={gpu_api_key} uv run {with_args} python",
    )
    return job

#### GET /pipelines/{id}/jobs

```python
def list_pipeline_jobs(
    pipeline_id: UUID,
    user_id: str = Depends(get_current_user),
):
    pipeline = session.get(PipelineTable, pipeline_id)
    if not pipeline or pipeline.user_id != user_id:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    jobs = session.exec(
        select(Job).where(Job.pipeline_id == pipeline_id).order_by(Job.created_at.desc())
    ).all()
    return jobs

#### GET /jobs/{job_id}

```python
def get_job(
    job_id: UUID,
    user_id: str = Depends(get_current_user),
):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    pipeline = session.get(PipelineTable, job.pipeline_id)
    if not pipeline or pipeline.user_id != user_id:
        raise HTTPException(status_code=404, detail="Job not found")
```

#### GPU Callbacks (auth: GPU_API_KEY)

Le GPU appelle ces endpoints pour rapporter son état. Pas de JWT — authentification par `GPU_API_KEY` partagé dans le header `Authorization: Bearer`.

```python
# mlblock/server/gpu_auth.py
import os
from fastapi import Header, HTTPException

GPU_API_KEY = os.environ["GPU_API_KEY"]

def verify_gpu_key(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer ") or authorization[7:] != GPU_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid GPU key")
    return "gpu"
```

#### POST /jobs/{job_id}/status

Le GPU notifie le changement d'état d'un bloc.

```python
def update_job_status(
    job_id: UUID,
    body: JobStatusUpdate,
    _: str = Depends(verify_gpu_key),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = body.status
    if body.status == "running" and not job.started_at:
        job.started_at = datetime.now(timezone.utc)
    if body.status in ("done", "error"):
        job.completed_at = datetime.now(timezone.utc)
        # Destroy Vast.ai instance to stop charges
        if job.vast_instance_id:
            try:
                vast = VastAI(api_key=os.environ["VAST_API_KEY"])
                vast.destroy_instance(job.vast_instance_id)
            except Exception:
                pass
    session.add(job)
    session.commit()

```python
class JobStatusUpdate(BaseModel):
    block: str           # nom du bloc en cours
    status: str          # "running" | "done" | "error"
```

#### POST /jobs/{job_id}/output

Le GPU pousse le résultat d'un bloc après exécution.

```python
def push_job_output(
    job_id: UUID,
    body: JobOutputPush,
    _: str = Depends(verify_gpu_key),
) -> None:
    job = session.get(Job, job_id)
    output = JobOutput(
        job_id=job_id,
        block_name=body.block,
        output=body.output,
    )
    session.add(output)
    session.commit()
```

```python
class JobOutputPush(BaseModel):
    block: str     # nom du bloc
    output: str    # résultat (truncaté à 10k chars côté GPU)
```

#### POST /jobs/{job_id}/error

Le GPU rapporte une erreur et le backend met le job en status `error`.

```python
def push_job_error(
    job_id: UUID,
    body: JobErrorPush,
    _: str = Depends(verify_gpu_key),
) -> None:
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = "error"
    job.error = body.error
    job.completed_at = datetime.now(timezone.utc)
    # Destroy Vast.ai instance to stop charges
    if job.vast_instance_id:
        try:
            vast = VastAI(api_key=os.environ["VAST_API_KEY"])
            vast.destroy_instance(job.vast_instance_id)
        except Exception:
            pass
    session.add(job)
    # Enregistre aussi l'erreur comme output pour historique
    output = JobOutput(
        job_id=job_id,
        block_name=body.block,
        output=f"ERROR: {body.error}",
    )
    session.add(output)
    session.commit()

```python
class JobErrorPush(BaseModel):
    block: str    # nom du bloc qui a échoué
    error: str    # message d'erreur
```


### Auto-discovery des blocs

Au démarrage, `mlblock/__init__.py` importe `mlblock.blocks.registry`, ce qui déclenche `_discover()` :

```python
BLOCK_SOURCES: dict[str, str] = {}

def _discover():
    pkg_dir = Path(__file__).parent
    for py_file in sorted(pkg_dir.rglob("*.py")):
        if py_file.name in ("__init__.py", "registry.py"):
            continue
        folder = py_file.parent.name
        cat_name = folder.split("_")[0]
        color = _color_from_folder(folder)
        category = Category(name=cat_name, color=color) if color else Category(name=cat_name, color="#6B7280")
        rel = py_file.relative_to(pkg_dir.parent)
        module_name = "mlblock." + ".".join(rel.with_suffix("").parts)
        module = importlib.import_module(module_name)
        for name, fn in vars(module).items():
            if name.startswith("_"):
                continue
            if not callable(fn):
                continue
            if fn.__module__ != module_name:
                continue
            block = _inspect_function(name, fn, category)
            BLOCK_REGISTRY[name] = block
            BLOCK_SOURCES[name] = inspect.getsource(fn)
```

**Mécanisme :**

| Étape | Détail |
|---|---|
| **Déclencheur** | `import mlblock.blocks.registry` dans `mlblock/__init__.py` |
| **Scan** | `rglob("*.py")` récursif — ignore `__init__.py` et `registry.py` |
| **Filtre** | ignore les fonctions commençant par `_` (helpers privés) |
| **Catégorie** | extraite du nom de dossier → `Category(name="neural", color="#6366F1")` |
| **Inspection** | `inspect.signature(fn)` → tous les paramètres (noms, types, défauts), annotation de retour |
| **Description bloc** | `fn.__doc__` (docstring de la fonction) |
| **Description params** | extraite du docstring (convention Sphinx ou Google) |
| **Enregistrement** | stocké dans `BLOCK_REGISTRY` (dict `name → Block`) |

Le discovery n'applique **aucune règle** pour distinguer entrées et paramètres utilisateur — il expose tout au frontend.

Tous les paramètres de la fonction sont inspectés et deviennent des `ParamInfo` dans le schéma — aucun traitement spécial :

```python
import re

def _extract_deps(fn: Callable) -> list[str]:
    deps: set[str] = set()
    module = inspect.getmodule(fn)
    if not module or not hasattr(module, "__file__") or not module.__file__:
        return []
    try:
        with open(module.__file__, "r", encoding="utf-8") as f:
            source = f.read()
    except Exception:
        return []
    
    IMPORT_TO_PIP = {
        "sklearn": "scikit-learn",
        "PIL": "pillow",
        "yaml": "pyyaml",
    }
    
    for line in source.splitlines():
        m = re.match(r"^\s*(?:from\s+(\S+)|import\s+(\S+))", line)
        if m:
            pkg = (m.group(1) or m.group(2)).split(".")[0]
            if pkg not in ("os", "sys", "math", "typing", "inspect", "importlib", "pathlib", "re"):
                pkg = IMPORT_TO_PIP.get(pkg, pkg)
                deps.add(pkg)
    return sorted(deps)


def _inspect_function(name: str, fn: Callable, category: Category) -> Block:
    sig = inspect.signature(fn)
    params = {}
    for pname, p in sig.parameters.items():
        ptype = _name(p.annotation) if p.annotation != inspect.Parameter.empty else "Any"
        pdesc = _extract_param_desc(fn.__doc__, pname) or ""
        pdefault = None if p.default == inspect.Parameter.empty else p.default
        prequired = p.default == inspect.Parameter.empty
        params[pname] = ParamInfo(type=ptype, description=pdesc, default=pdefault, required=prequired)
    outputs = _parse_return_annotation(sig.return_annotation)
    return Block(name=name, description=fn.__doc__, category=category, params=params, outputs=outputs, deps=_extract_deps(fn))

Le discovery ne fait **aucune supposition** sur ce qui est une entrée ou un paramètre utilisateur. Toute cette logique est gérée par le frontend, qui utilise les types (`ParamInfo.type`) pour proposer des connexions entre blocs compatibles.

**Côté frontend :** pour chaque paramètre d'un bloc, l'utilisateur peut choisir :
- Saisir une valeur directement (pour les types simples : int, float, str, bool)
- Le connecter à la sortie (`out_N`) d'un bloc précédent si le type est compatible

Exemple : si `conv2d` expose `x: Tensor` et que le bloc précédent produit `out_1: Tensor`, le frontend propose de connecter `x` → `out_1`. Sinon, l'utilisateur doit fournir une valeur.

### Dossiers de catégories

Les blocs sont rangés dans des dossiers sous `mlblock/blocks/`. Chaque dossier suit la convention `NOM_COULEUR`.

```
mlblock/blocks/
  neural_6366F1/       # 33 blocs : conv2d, relu, dropout...
  data_22C55E/         # load_csv, train_test_split
  models_F59E0B/       # linear_regression, logistic_regression, random_forest
  evaluation_EF4444/   # evaluate
  advanced_6B7280/     # auto_ml, code_block
  rl_8B5CF6/          # train_rl, evaluate_rl
  environment_14B8A6/  # gym_env, single_env, space_def...
  visualization_EC4899/ # plot_predictions, record_video, render_rl
```

### Définition d'un bloc — exemple

**Convention :** les imports sont en haut du fichier (comme tout fichier Python standard). La fonction principale est publique (pas de `_`), les helpers sont préfixés par `_`.

```python
"""2D convolution layer for neural networks."""

from torch import nn


def conv2d(
    x: torch.Tensor,
    in_channels: int,
    out_channels: int,
    kernel_size: int = 3,
) -> torch.Tensor:
    """Applies a 2D convolution over an input signal.

    Args:
        x: Input tensor of shape (N, C_in, H, W).
        in_channels: Number of channels in the input image.
        out_channels: Number of channels produced by the convolution.
        kernel_size: Size of the convolving kernel (default 3).
    """
    return nn.Conv2d(in_channels, out_channels, kernel_size)(x)
```

Ce fichier `.py` est tout ce qu'il faut. Le discovery extrait :

| Champ de `Block` | Source |
|---|---|
| `name` | `fn.__name__` → `"conv2d"` |
| `description` | `fn.__doc__` → `"Applies a 2D convolution..."` |
| `category` | extrait du dossier → `Category(name="neural", color="#6366F1")` |
| `x.type` | annotation de type → `"Tensor"` |
| `in_channels.type` | annotation de type → `"int"` |
| `kernel_size.default` | valeur par défaut → `3` |
| `kernel_size.required` | `False` (a une valeur par défaut) |
| `in_channels.description` | extrait du docstring → `"Number of channels in the input image"` |
| `outputs` | annotation de retour → `[{"name": "out", "dtype": "Tensor"}]` |

Les helpers privés (préfixés `_`) sont ignorés par le discovery. Les noms des paramètres deviennent les clés que le frontend affiche à l'utilisateur.

### Génération de code

Le constructeur prend le **fichier source complet** de chaque fonction bloc et l'inline dans le code généré. Le generator ajoute les wrappers de notification GPU autour de chaque bloc.

```python
def _source_for(block_name: str) -> str:
    return BLOCK_SOURCES[block_name]


def _blocks_used_in(nodes: list[PipelineNode]) -> list[str]:
    return list({n.type for n in nodes})


def _topological_sort(nodes: list[PipelineNode], edges: list[PipelineEdge]) -> list[str]:
    graph: dict[str, list[str]] = {n.id: [] for n in nodes}
    in_degree: dict[str, int] = {n.id: 0 for n in nodes}
    for edge in edges:
        graph.setdefault(edge.source, []).append(edge.target)
        in_degree[edge.target] = in_degree.get(edge.target, 0) + 1
    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    order = []
    while queue:
        nid = queue.pop(0)
        order.append(nid)
        for t in graph.get(nid, []):
            in_degree[t] -= 1
            if in_degree[t] == 0:
                queue.append(t)
    return order


def generate_code(nodes: list[PipelineNode], edges: list[PipelineEdge]) -> str:
    lines = ['"""Generated by MLBlock."""', ""]

    # Imports pour les callbacks GPU
    lines.append("import requests")
    lines.append("import os")
    lines.append("")
    lines.append("BACKEND_URL = os.environ['BACKEND_URL']")
    lines.append("GPU_API_KEY = os.environ['GPU_API_KEY']")
    lines.append("JOB_ID = os.environ['JOB_ID']")
    lines.append("")
    lines.append("def notify_status(block, status):")
    lines.append("    try:")
    lines.append("        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/status',")
    lines.append("            json={'block': block, 'status': status},")
    lines.append("            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)")
    lines.append("    except Exception: pass")
    lines.append("")
    lines.append("def notify_output(block, output):")
    lines.append("    try:")
    lines.append("        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/output',")
    lines.append("            json={'block': block, 'output': str(output)[:10000]},")
    lines.append("            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)")
    lines.append("    except Exception: pass")
    lines.append("")
    lines.append("def notify_error(block, error):")
    lines.append("    try:")
    lines.append("        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/error',")
    lines.append("            json={'block': block, 'error': str(error)},")
    lines.append("            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)")
    lines.append("    except Exception: pass")
    lines.append("")

    # Blocs dédupliqués
    seen = set()
    for node in nodes:
        if node.type in seen:
            continue
        seen.add(node.type)
        source = _source_for(node.type)
        lines.append(f"# === {node.type} ===")
        lines.append(source.strip())
        lines.append("")

    # main() avec tri topologique + notifications par bloc
    lines.append("def main():")
    lines.append("    try:")
    
    order = _topological_sort(nodes, edges)
    if len(order) != len(nodes):
        raise ValueError("Cycle detected in pipeline graph")
        
    for node_id in order:
        node = next(n for n in nodes if n.id == node_id)
        block = BLOCK_REGISTRY[node.type]
        params = ", ".join(f"{k}={v!r}" for k, v in node.params.items())
        
        resolved_inputs = []
        for edge in edges:
            if edge.target == node_id:
                source_node = next(n for n in nodes if n.id == edge.source)
                source_block = BLOCK_REGISTRY[source_node.type]
                if len(source_block.outputs) > 1:
                    var_name = f"out_{edge.source}_{edge.source_port}"
                else:
                    var_name = f"out_{edge.source}"
                resolved_inputs.append(f"{edge.target_port}={var_name}")
        inputs = ", ".join(resolved_inputs)
        
        args = ", ".join(filter(None, [inputs, params]))
        lines.append(f"        notify_status('{node.type}', 'running')")
        if len(block.outputs) <= 1:
            lines.append(f"        out_{node_id} = {node.type}({args})")
            lines.append(f"        notify_output('{node.type}', out_{node_id})")
        else:
            targets = ", ".join(f"out_{node_id}_{o['name']}" for o in block.outputs)
            lines.append(f"        {targets} = {node.type}({args})")
            lines.append(f"        notify_output('{node.type}', {targets})")
        lines.append(f"        notify_status('{node.type}', 'done')")
    lines.append("        notify_status('pipeline', 'done')")
    lines.append("    except Exception as e:")
    lines.append("        notify_error('pipeline', e)")
    lines.append("        raise")
    lines.append("")
    lines.append('if __name__ == "__main__":')
    lines.append("    main()")
    return "\n".join(lines)
```

Exemple de code généré (pour le DAG ci-dessus) :

```python
"""Generated by MLBlock."""

import requests
import os

BACKEND_URL = os.environ['BACKEND_URL']
GPU_API_KEY = os.environ['GPU_API_KEY']
JOB_ID = os.environ['JOB_ID']

def notify_status(block, status):
    try:
        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/status',
            json={'block': block, 'status': status},
            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)
    except Exception: pass

def notify_output(block, output):
    try:
        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/output',
            json={'block': block, 'output': str(output)[:10000]},
            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)
    except Exception: pass

def notify_error(block, error):
    try:
        requests.post(f'{BACKEND_URL}/jobs/{JOB_ID}/error',
            json={'block': block, 'error': str(error)},
            headers={'Authorization': f'Bearer {GPU_API_KEY}'}, timeout=5)
    except Exception: pass

# === load_csv ===
import pandas as pd

def load_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)

# === train_test_split ===
from sklearn.model_selection import train_test_split as tts

def train_test_split(data, target_column, test_size=0.2):
    X = data.drop(columns=[target_column])
    y = data[target_column]
    return tts(X, y, test_size=test_size)

# === linear_regression ===
from sklearn.linear_model import LinearRegression

def linear_regression(train_data, train_target):
    return LinearRegression().fit(train_data, train_target)

def main():
    try:
        notify_status('load_csv', 'running')
        out_n1 = load_csv(path="ventes.csv")
        notify_output('load_csv', out_n1.head().to_string())
        notify_status('load_csv', 'done')

        notify_status('train_test_split', 'running')
        out_n2_X_train, out_n2_y_train = train_test_split(
            data=out_n1, target_column="prix", test_size=0.2)
        notify_output('train_test_split', f"X shape: {out_n2_X_train.shape}")
        notify_status('train_test_split', 'done')

        notify_status('linear_regression', 'running')
        out_n3 = linear_regression(train_data=out_n2_X_train, train_target=out_n2_y_train)
        notify_output('linear_regression', f"coef: {out_n3.coef_}")
        notify_status('linear_regression', 'done')

        notify_status('pipeline', 'done')
    except Exception as e:
        notify_error('pipeline', e)
        raise

if __name__ == "__main__":
    main()
```


#### Dépendances par bloc

Chaque bloc déclare ses dépendances pip via le champ `deps` du `Block` (extrait automatiquement des imports par le discovery). Le generator collecte les deps de tous les blocs utilisés et génère les arguments `--with` pour `uv run`.

```python
def _collect_dependencies(blocks_used: list[str]) -> str:
    """Collecte les deps de chaque bloc utilisé et retourne la chaîne --with."""
    reqs: set[str] = set()
    for block_name in blocks_used:
        block = BLOCK_REGISTRY.get(block_name)
        if block:
            reqs.update(block.deps)
    return " ".join(f"--with {d}" for d in sorted(reqs))
```

Le fichier `requirements.txt` généré est converti en arguments `--with` pour `uv run` — pas de fichier sur l'instance, `uv run` installe les dépendances à la volée et pipe le code directement.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `mlblock/__main__.py` | CLI entry (dev local) |
| `mlblock/blocks/registry.py` | Auto-discovery via `inspect.signature` |
| `mlblock/server/routes.py` | API REST (blocks, pipelines, validation, jobs) |
| `mlblock/server/gpu_auth.py` | Auth GPU callback (GPU_API_KEY) |
| `mlblock/server/main.py` | FastAPI app |

### Exécution GPU — Vast.ai

Le backend utilise **Vast.ai** pour louer un GPU à la seconde. L'image Docker est `ghcr.io/astral-sh/uv:python3.13-bookworm` (Debian-based glibc pour supporter les wheels de PyTorch/CUDA).

#### Facturation

Vast.ai facture à la **seconde** (GPU compute) — pas de minimum, pas d'arrondi à la minute. Une exécution de 10s coûte ~10s × $0.25/hr = **$0.0007**.

Par contre, le **storage** est facturé tant que l'instance existe (même arrêtée). Donc après chaque run, on **détruit** l'instance (`DELETE /api/v0/instances/{id}`) pour arrêter toute facturation.

#### Image Docker

```dockerfile
FROM ghcr.io/astral-sh/uv:python3.13-bookworm
WORKDIR /app
```

#### MVP : instances On-Demand

| Paramètre | Valeur |
|---|---|
| **GPU** | NVIDIA T4 |
| **Type** | On-Demand (non-interruptible) |
| **Prix** | $0.20-0.30/hr (GPU compute) + $0.001/hr (storage) |
| **Image** | `ghcr.io/astral-sh/uv:python3.13-bookworm` |
| **Cold start** | ~30s + temps d'installation des dépendances |

#### Supabase Storage & URLs Signées

Pour les pipelines nécessitant des datasets volumineux en entrée (ex: `load_csv`) ou produisant des poids de modèle en sortie (ex: `save_model`), les instances de calcul GPU (Vast.ai) doivent pouvoir lire et écrire des fichiers de manière sécurisée.

Plutôt que de partager la clé API d'administration (`service_role`) avec le conteneur GPU, le backend génère des **URLs signées temporaires** (valables pendant la durée de l'exécution, ex: 1 heure) :

1. **Téléchargement (Lecture seule)** : Pour les blocs lisant des fichiers, le backend génère une URL de téléchargement signée via `create_signed_url` et l'injecte dans le script ou dans les variables d'environnement.
2. **Dépôt (Écriture seule)** : Pour sauvegarder des artéfacts d'entraînement, le backend génère une URL de dépôt signée via `create_signed_upload_url` et un token associé, permettant au GPU de pousser les données avec une requête HTTP `PUT`.

##### Exemple d'implémentation du client Python (backend) :

```python
from supabase import create_client, Client
import os

supabase: Client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

def get_dataset_download_url(bucket: str, path: str) -> str:
    # Génère une URL signée valable 1 heure
    res = supabase.storage.from_(bucket).create_signed_url(path, expires_in=3600)
    return res["signedURL"]

def get_model_upload_url(bucket: str, path: str) -> dict:
    # Génère une URL signée pour pousser les poids du modèle
    res = supabase.storage.from_(bucket).create_signed_upload_url(path)
    return {
        "signed_url": res["signed_url"],
        "token": res["token"]
    }
```

#### Session lifecycle

```
POST /pipelines/{id}/execute
    │
    ▼
Charge la pipeline + code depuis la DB
    │
    ▼
Collecte les deps → construit les --with args pour uv
    │
    ▼
Crée l'instance + job en DB (status: queued)
    │
    ▼
start_instance → sleep 15s (attente SSH/execute)
    │
    ▼
execute("echo '{code_b64}' | base64 -d | JOB_ID={id} BACKEND_URL={url} GPU_API_KEY={key} uv run --with torch ... python")
    │
    ▼
GPU main() s'exécute:
    │
    ├── POST /jobs/{JOB_ID}/status → {block: "load_csv", status: "running"}
    ├── execute load_csv
    ├── POST /jobs/{JOB_ID}/output → {block: "load_csv", output: "..."}
    ├── POST /jobs/{JOB_ID}/status → {block: "load_csv", status: "done"}
    │
    ├── POST /jobs/{JOB_ID}/status → {block: "train_test_split", status: "running"}
    ├── execute train_test_split
    ├── POST /jobs/{JOB_ID}/output → {block: "train_test_split", output: "..."}
    ├── POST /jobs/{JOB_ID}/status → {block: "train_test_split", status: "done"}
    │
    ├── ... (chaque bloc suit le même pattern)
    │
    ├── POST /jobs/{JOB_ID}/status → {block: "pipeline", status: "done"}
    │
    ▼
GPU appelle POST /jobs/{JOB_ID}/status → done
    │
    ▼
Backend reçoit status=done → détruit l'instance Vast.ai (DELETE)
    │
    ▼
job status: done, completed_at: now
```

#### Exemple d'implémentation — GPU callback

```python
# Généré dans main.py uploadé sur le GPU
import requests
import os

BACKEND_URL = os.environ["BACKEND_URL"]
GPU_API_KEY = os.environ["GPU_API_KEY"]
JOB_ID = os.environ["JOB_ID"]

def notify_status(block, status):
    try:
        requests.post(f"{BACKEND_URL}/jobs/{JOB_ID}/status",
            json={"block": block, "status": status},
            headers={"Authorization": f"Bearer {GPU_API_KEY}"},
            timeout=5)
    except Exception:
        pass  # ponytail: ne pas crasher le pipeline pour un report

def notify_output(block, output):
    try:
        requests.post(f"{BACKEND_URL}/jobs/{JOB_ID}/output",
            json={"block": block, "output": str(output)[:10000]},
            headers={"Authorization": f"Bearer {GPU_API_KEY}"},
            timeout=5)
    except Exception:
        pass

def notify_error(block, error):
    try:
        requests.post(f"{BACKEND_URL}/jobs/{JOB_ID}/error",
            json={"block": block, "error": str(error)},
            headers={"Authorization": f"Bearer {GPU_API_KEY}"},
            timeout=5)
    except Exception:
        pass

def main():
    try:
        notify_status("load_csv", "running")
        out_n1 = load_csv(path="ventes.csv")
        notify_output("load_csv", out_n1.head().to_string())
        notify_status("load_csv", "done")

        notify_status("train_test_split", "running")
        out_n2_X_train, out_n2_y_train = train_test_split(
            data=out_n1, target_column="prix", test_size=0.2)
        notify_output("train_test_split", f"X shape: {out_n2_X_train.shape}")
        notify_status("train_test_split", "done")

        notify_status("linear_regression", "running")
        out_n3 = linear_regression(train_data=out_n2_X_train, train_target=out_n2_y_train)
        notify_output("linear_regression", f"coef: {out_n3.coef_}")
        notify_status("linear_regression", "done")

        notify_status("pipeline", "done")
    except Exception as e:
        notify_error("pipeline", e)
        raise
```



---

## Database

Le backend utilise **PostgreSQL** via **Supabase**. Les tables sont créées avec SQLModel au démarrage.

### Connexion et Configuration

Le backend se connecte à PostgreSQL (Supabase) via **SQLModel** (avec le pilote `psycopg`). La configuration requiert la variable d'environnement `DATABASE_URL`.

```python
# mlblock/server/database.py
import os
from collections.abc import Generator
from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = os.environ["DATABASE_URL"]

# Configuration de l'engine SQLModel avec pooling de connexions pour PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600
)

def init_db() -> None:
    # Création des tables si elles n'existent pas
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

La fonction `init_db()` est appelée au démarrage de l'application FastAPI via le mécanisme de `lifespan` :

```python
# mlblock/server/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from mlblock.server.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="MLBlock Server", lifespan=lifespan)
```

### Guide d'Installation et Configuration Initiale de Supabase

Pour configurer la connexion initiale et les dépendances nécessaires au projet :

#### 1. Installation des Dépendances
Installez les dépendances requises pour charger les variables d'environnement et s'interconnecter avec PostgreSQL :

```bash
pip install python-dotenv psycopg2
```

#### 2. Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine de votre projet avec la chaîne de connexion Supabase.
> **Note :** Si votre mot de passe de base de données contient des caractères spéciaux, vous devrez les encoder en pourcentage (percent-encode) dans l'URL de connexion.

```ini
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.hrvbsbkcbtgephuntgqd.supabase.co:5432/postgres
```

##### Informations de connexion de référence :
* **Host :** `db.hrvbsbkcbtgephuntgqd.supabase.co`
* **Port :** `5432`
* **Database :** `postgres`
* **User :** `postgres`

##### Exemple de script de test de connexion (`main.py`) :

```python
import os
import psycopg2
from dotenv import load_dotenv

# Chargement des variables d'environnement du fichier .env
load_dotenv()

# Récupération de la chaîne de connexion
DATABASE_URL = os.getenv("DATABASE_URL")

# Test de connexion directe à la base de données
connection = psycopg2.connect(DATABASE_URL)
```

#### 3. Installation des Agent Skills (Optionnel)
Les Agent Skills donnent aux outils de code IA des instructions clés en main, des scripts et des ressources pour travailler avec Supabase de façon plus précise et efficace.

```bash
npx skills add supabase/agent-skills
```


| Table | Rôle |
|---|---|
| `profiles` | Données utilisateur (optionnel) |
| `pipelines` | Sauvegarde des pipelines (nodes + edges + code généré) |
| `jobs` | Suivi d'exécution sur GPU |
| `job_outputs` | Résultats par bloc (un row par bloc exécuté) |

### Table `profiles`

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Table `pipelines`

```sql
CREATE TABLE pipelines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  nodes      JSONB DEFAULT '[]'    NOT NULL,  -- [{id, type, params, children}, ...]
  edges      JSONB DEFAULT '[]'    NOT NULL,  -- [{source, source_port, target, target_port}, ...]
  code       TEXT DEFAULT ''       NOT NULL,  -- Python généré
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_pipelines_user ON pipelines(user_id);
```

### Table `jobs`

```sql
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'queued' NOT NULL,
  vast_instance_id TEXT DEFAULT '',
  output          TEXT DEFAULT '',
  error           TEXT DEFAULT '',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

  CONSTRAINT chk_job_status CHECK (status IN ('queued', 'running', 'done', 'error'))
);

CREATE INDEX idx_jobs_user    ON jobs(user_id);
CREATE INDEX idx_jobs_pipeline ON jobs(pipeline_id);
CREATE INDEX idx_jobs_status  ON jobs(status);

-- Realtime pour le frontend
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
```

### Table `job_outputs`

```sql
CREATE TABLE job_outputs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  output     TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_job_outputs_job ON job_outputs(job_id);

-- Realtime pour le frontend (progression par bloc)
ALTER PUBLICATION supabase_realtime ADD TABLE job_outputs;
```

### Realtime

Le frontend s'abonne à deux tables via Supabase Realtime :
- `jobs` — mises à jour de statut global (running, done, error)
- `job_outputs` — résultats par bloc en direct (chaque bloc affiche son output au fur et à mesure)

```typescript
// Statut global du job
const jobSub = supabase
  .channel('job-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
    (payload) => {
      setJobStatus(payload.new.status)
      if (payload.new.error) setError(payload.new.error)
    }
  )
  .subscribe()

// Résultats par bloc (un message par bloc exécuté)
const outputSub = supabase
  .channel('job-outputs')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'job_outputs', filter: `job_id=eq.${jobId}` },
    (payload) => {
      appendBlockOutput(payload.new.block_name, payload.new.output)
    }
  )
  .subscribe()
```

---

## Coûts estimés — MVP

Hypothèses : 100 users, 50 actifs/jour, 3 runs/user/jour, 5min moyen par run, GPU T4 On-Demand.

| Composant | Coût/mois |
|---|---|
| **Frontend** (Vercel/Netlify Free) | $0 |
| **Backend** (VPS léger ou free tier) | $0-10 |
| **Supabase** (Free tier) | $0 |
| **Vast.ai T4** (150 runs × 5min × $0.25/hr) | ~$31 |
| **TOTAL** | **~$31-41/mois** |

Par user : $0.31/mois de compute. Pricing $5/mois → marge 16×.

---

## Sources

- [Vast.ai API Documentation](https://console.vast.ai/docs/)
- [Supabase Free Tier](https://supabase.com/pricing)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [GPUs.io — comparateur de prix GPU](https://gpus.io)
