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

Le frontend s'abonne aux changements via **Supabase Realtime** :

```typescript
const subscription = supabase
  .channel('job-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `id=eq.${jobId}` },
    (payload) => {
      setJobStatus(payload.new.status)
      setOutput(payload.new.output)
    }
  )
  .subscribe()
```

---

## Server

| Technologie | Rôle |
|---|---|
| FastAPI (Python) | API REST, génération de code, orchestration GPU |
| uv | Dépendances Python |

### Principes d'architecture

1. **Server-authoritative** : le backend valide et génère le code. Le client ne run jamais la logique.
2. **State externalisé** : tout le state vit dans PostgreSQL. Le GPU est jetable.
3. **Compute éphémère** : les instances GPU sont créées et détruites. Pas d'état persistant.
4. **Realtime** : les résultats remontent en live via Supabase Realtime, pas de polling.

### Modèle Pydantic — Block

```python
from pydantic import BaseModel
from typing import Any


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


class Page(BaseModel):
    items: list[Block]
    total: int
    page: int
    size: int
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

Une pipeline est une **liste ordonnée de blocs numérotés** (1, 2, 3…). Chaque bloc reçoit en entrée la sortie du bloc précédent, et une liste déroulante permet de choisir n'importe quel `out_N` antérieur.
```
Frontend envoie :
{
  "name": "Analyse ventes",
  "blocks": [
    {
      "name": "load_csv",
      "params": {"path": "ventes.csv"},
      "inputs": {}                    # 1er bloc, pas d'entrée
    },
    {
      "name": "train_test_split",
      "params": {"target_column": "prix", "test_size": 0.2},
      "inputs": {"data": "out_1"}     # par défaut : out_1
    },
    {
      "name": "linear_regression",
      "params": {},
      "inputs": {"train_data": "out_2", "train_target": "out_4"}
                                      # l'user a choisi out_2 et out_4
    },
  ]
}
```

Par défaut, chaque bloc pointe vers `out_N` où `N` est l'index du bloc immédiatement précédent. L'utilisateur peut changer cette valeur via une liste déroulante affichant `out_1`, `out_2`, `out_3`… jusqu'à l'index du bloc courant.

Le serveur génère le `.py` en substituant les références :

```python
out_1 = load_csv(path="ventes.csv")
out_2, out_3, out_4, out_5 = train_test_split(data=out_1, target_column="prix", test_size=0.2)
out_6 = linear_regression(train_data=out_2, train_target=out_4)
```

Chaque `out_N` est la variable Python générée. Les paramètres utilisateur (`path`, `target_column`…) passent en kwargs, les connexions (`data=out_1`) aussi.

### Routes

| Méthode | Route | Action |
|---|---|---|
| `GET` | `/blocks?page=N` | Liste les blocs. Sans `?page` : tout. Avec `?page=N` : 30 par page |
| `POST` | `/pipelines/save` | Valide les blocs, génère le `.py`, sauvegarde en DB |
| `POST` | `/pipelines/{id}/execute` | Charge la pipeline de la DB, crée une instance Vast.ai, exécute le code |

#### POST /pipelines/save

```python
def save_pipeline(body: PipelineCreate) -> PipelineDetail:
    code = generate_code(body.blocks)
    row = Pipeline(name=body.name, blocks=body.blocks, code=code)
    session.add(row)
    session.commit()
    return row
```

#### POST /pipelines/{id}/execute

```python
def execute_pipeline(id: int) -> JobStatus:
    row = session.get(Pipeline, id)
    code = row.code
    reqs = _detect_dependencies(code)

    vast = VastAI(api_key="...")
    instance = vast.create_instance(
        image="ghcr.io/astral-sh/uv:python3.13-alpine",
        disk=10,
        onstart="uv sync && python main.py",
    )
    vast.upload(instance["id"], "/app/main.py", code)
    vast.upload(instance["id"], "/app/requirements.txt", reqs)
    vast.upload(instance["id"], "/app/pyproject.toml", _pyproject(reqs))
    vast.start(instance["id"])

    job = Job(pipeline_id=id, vast_instance_id=instance["id"])
    session.add(job)
    session.commit()
    return job
```

#### GET /blocks

```python
def list_blocks(page: int | None = None) -> list[Block] | Page[Block]:
    items = list(BLOCK_REGISTRY.values())
    if page is None:
        return items
    size = 30
    start = (page - 1) * size
    sliced = items[start : start + size]
    total = len(items)
    return Page(items=sliced, total=total, page=page, size=size)
```

Sans `?page` : retourne tous les blocs en une seule liste. Avec `?page=N` : retourne 30 blocs avec métadonnées de pagination (total, page, size).

### Auto-discovery des blocs

Au démarrage, `mlblock/__init__.py` importe `mlblock.blocks.registry`, ce qui déclenche `_discover()` :

```python
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
    return Block(name=name, description=fn.__doc__, category=category, params=params, outputs=outputs)
```

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

Le constructeur prend le **fichier source complet** de chaque fonction bloc et l'inline dans le code généré. Puis il appelle chaque fonction dans l'ordre avec ses paramètres.

```python
def generate_code(blocks: list[BlockCall]) -> str:
    lines = ['"""Generated by MLBlock."""', ""]

    seen = set()
    for block in blocks:
        if block.name in seen:
            continue
        seen.add(block.name)
        source = _source_for(block.name)      # lit le fichier .py du bloc
        lines.append(f"# === {block.name} ===")
        lines.append(source.strip())
        lines.append("")

    lines.append("def main():")
    for i, block in enumerate(blocks):
        out_idx = i + 1
        params = ", ".join(f"{k}={v!r}" for k, v in block.params.items())
        inputs = ", ".join(f"{k}={v}" for k, v in block.inputs.items())
        args = ", ".join(filter(None, [inputs, params]))
        lines.append(f"    out_{out_idx} = {block.name}({args})")

    lines.append("")
    lines.append('if __name__ == "__main__":')
    lines.append("    main()")
    return "\n".join(lines)
```

Exemple de code généré :

```python
"""Generated by MLBlock."""

# === load_csv ===
import pandas as pd

def load_csv(path: str) -> pd.DataFrame:
    return pd.read_csv(path)

# === train_test_split ===
from sklearn.model_selection import train_test_split as tts

def train_test_split(data: pd.DataFrame, target_column: str, test_size: float = 0.2) -> tuple:
    X = data.drop(columns=[target_column])
    y = data[target_column]
    return tts(X, y, test_size=test_size)

# === linear_regression ===
from sklearn.linear_model import LinearRegression

def linear_regression(train_data: pd.DataFrame, train_target: pd.Series) -> LinearRegression:
    return LinearRegression().fit(train_data, train_target)

def main():
    out_1 = load_csv(path="ventes.csv")
    out_2, out_3, out_4, out_5 = train_test_split(data=out_1, target_column="prix", test_size=0.2)
    out_6 = linear_regression(train_data=out_2, train_target=out_4)

if __name__ == "__main__":
    main()
```


#### _detect_dependencies()

Avant l'exécution GPU, le backend analyse les imports du code généré pour construire un `requirements.txt` :

```python
IMPORT_MAP = {
    "torch": "torch",
    "sklearn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "numpy",
    "matplotlib": "matplotlib",
    "gymnasium": "gymnasium",
    "stable_baselines3": "stable-baselines3",
}

def _detect_dependencies(code: str) -> str:
    """Analyse les imports du code et retourne un requirements.txt."""
    reqs = set()
    for line in code.splitlines():
        line = line.strip()
        if line.startswith("import "):
            mod = line.split()[1].split(".")[0]
            if mod in IMPORT_MAP:
                reqs.add(IMPORT_MAP[mod])
        elif line.startswith("from "):
            mod = line.split()[1].split(".")[0]
            if mod in IMPORT_MAP:
                reqs.add(IMPORT_MAP[mod])
    return "\n".join(sorted(reqs))
```

Le fichier `requirements.txt` généré est uploadé sur l'instance Vast.ai avec le code. `uv sync` installe automatiquement les dépendances listées.

### Fichiers clés

| Fichier | Rôle |
|---|---|
| `mlblock/__main__.py` | CLI entry (dev local) |
| `mlblock/blocks/registry.py` | Auto-discovery via `inspect.signature` |
| `mlblock/server/routes.py` | API REST (save, execute) |
| `mlblock/server/main.py` | FastAPI app |

### Exécution GPU — Vast.ai

Le backend utilise **Vast.ai** pour louer un GPU à la seconde. L'image Docker est `ghcr.io/astral-sh/uv:python3.13-alpine`.

#### Facturation

Vast.ai facture à la **seconde** (GPU compute) — pas de minimum, pas d'arrondi à la minute. Une exécution de 10s coûte ~10s × $0.25/hr = **$0.0007**.

Par contre, le **storage** est facturé tant que l'instance existe (même arrêtée). Donc après chaque run, on **détruit** l'instance (`DELETE /api/v0/instances/{id}`) pour arrêter toute facturation.

#### Image Docker

```dockerfile
FROM ghcr.io/astral-sh/uv:python3.13-alpine
WORKDIR /app
```

#### MVP : instances On-Demand

| Paramètre | Valeur |
|---|---|
| **GPU** | NVIDIA T4 |
| **Type** | On-Demand (non-interruptible) |
| **Prix** | $0.20-0.30/hr (GPU compute) + $0.001/hr (storage) |
| **Image** | `ghcr.io/astral-sh/uv:python3.13-alpine` |
| **Cold start** | ~30s + temps d'installation des dépendances |

#### Session lifecycle

```
POST /pipelines/{id}/execute
    │
    ▼
Charge la pipeline + code depuis la DB
    │
    ▼
Backend analyse les imports → génère requirements.txt
    │
    ▼
Crée l'instance Vast.ai (onstart = "uv sync && python main.py")
    │
    ▼
Upload main.py, requirements.txt, pyproject.toml
    │
    ▼
Démarre l'instance → uv sync → python main.py
    │
    ▼
Le script push les résultats vers Supabase Realtime
    │
    ▼
Backend détecte la fin → détruit l'instance (DELETE)
    │
    ▼
job status: done
```

#### Exemple d'implémentation

```python
def execute_pipeline(id: int) -> JobStatus:
    row = session.get(Pipeline, id)
    code = row.code
    reqs = _detect_dependencies(code)

    vast = VastAI(api_key="...")
    instance = vast.create_instance(
        image="ghcr.io/astral-sh/uv:python3.13-alpine",
        disk=10,
        onstart="uv sync && python main.py",
    )
    vast.upload(instance["id"], "/app/main.py", code)
    vast.upload(instance["id"], "/app/requirements.txt", reqs)
    vast.upload(instance["id"], "/app/pyproject.toml", _pyproject(reqs))
    vast.start(instance["id"])

    job = Job(pipeline_id=id, vast_instance_id=instance["id"])
    session.add(job)
    session.commit()
    return job

def destroy_instance(instance_id: str):
    vast = VastAI(api_key="...")
    vast.destroy(instance_id)
```

Le backend peut poller le status du job sur Vast.ai toutes les 10s, ou faire en sorte que le script Python appel une API callback à la fin pour déclencher la destruction immédiate.

---

## Database

Le backend utilise **PostgreSQL** via **Supabase**. Les tables sont créées avec SQLModel au démarrage.

| Table | Rôle |
|---|---|
| `profiles` | Données utilisateur (optionnel) |
| `pipelines` | Sauvegarde des pipelines (blocs + code généré) |
| `jobs` | Suivi d'exécution sur GPU |

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
  blocks     JSONB DEFAULT '[]'    NOT NULL,  -- [{name, params, inputs}, ...]
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

### Realtime

Le frontend s'abonne à la table `jobs` via Supabase Realtime pour recevoir les mises à jour de statut et le output en direct. La publication `supabase_realtime` inclut la table `jobs`.

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
