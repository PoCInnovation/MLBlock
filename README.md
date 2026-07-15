# MLBlock

> **Le Scratch de l'IA.** Une plateforme pour apprendre et expérimenter le Machine Learning en assemblant des blocs visuels.

L'utilisateur dessine un DAG de blocs ML dans une interface visuelle → le backend assemble les fonctions Python dans l'ordre → sauvegarde en base de données → un GPU exécute le code. Chaque bloc est une **fonction Python standard** avec docstring et type hints.

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
                              │   (Supabase)     │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   GPU (Vast.ai)  │
                              │   Exécution .py  │
                              └─────────────────┘
```

### Principes

1. **Server-authoritative** — le backend valide et génère le code. Le client ne run jamais la logique.
2. **State externalisé** — tout l'état vit dans PostgreSQL. Le GPU est jetable.
3. **Compute éphémère** — les instances GPU sont créées et détruites. Pas d'état persistant.
4. **Realtime** — les résultats remontent en live via Supabase Realtime, pas de polling.
5. **Storage et URLs signées** — les données volumineuses transitent par Supabase Storage via des URLs temporaires signées.

---

## Tech Stack

| Technologie | Rôle |
|---|---|
| FastAPI (Python) | API REST, génération de code, orchestration GPU |
| Python | Langage des blocs et du serveur |
| Supabase (PostgreSQL) | Base de données, Auth, Realtime, Storage |
| Vast.ai | GPU éphémère (NVIDIA T4, On-Demand) |
| Pydantic | Validation des schémas API |
| SQLModel | ORM pour la base de données |
| python-jose | Validation des JWT Supabase |
| python-dotenv | Configuration des variables d'environnement |
| `ghcr.io/astral-sh/uv:python3.13-bookworm` | Image Docker pour exécution GPU |

---

## Démarrage Rapide

### 1. Installer les dépendances

```bash
pip install -e .
```

### 2. Configurer les variables d'environnement

Copiez le fichier d'exemple et remplissez vos credentials :

```bash
cp .env.example .env
```

Variables requises :

| Variable | Description |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL Supabase |
| `SUPABASE_URL` | URL de votre projet Supabase |
| `SUPABASE_KEY` | Clé API Supabase (service_role recommandé) |
| `SUPABASE_JWT_SECRET` | Secret JWT pour valider les tokens Auth |
| `VAST_API_KEY` | Clé API Vast.ai pour la location de GPU |
| `BACKEND_URL` | URL publique du backend (ex: `https://api.monapp.com`) |
| `GPU_API_KEY` | Clé partagée pour les callbacks GPU |

> **Note mot de passe :** Si votre mot de passe Supabase contient des caractères spéciaux (comme `?`), vous devez les encoder en pourcentage (percent-encode). Exemple : `airbaG42?133` → `airbaG42%3F133`.

### 3. Lancer le serveur

```bash
uvicorn mlblock.server.main:app --reload
```

Le serveur est accessible sur `http://localhost:8000`. L'initialisation des tables PostgreSQL est automatique au démarrage.

### 4. Lancer les tests

```bash
pytest
```

---

## Structure du Projet

```
mlblock/
├── blocks/                    # Définitions des blocs ML
│   ├── registry.py            # Auto-discovery des blocs (discovery, inspect)
│   ├── neural_6366F1/         # Blocs réseaux de neurones (conv2d, relu, ...)
│   ├── data_22C55E/           # Blocs data (load_csv, train_test_split)
│   ├── models_F59E0B/         # Blocs modèles (linear_regression, random_forest)
│   ├── evaluation_EF4444/     # Évaluation (evaluate)
│   ├── advanced_6B7280/       # Avancé (auto_ml, code_block)
│   ├── rl_8B5CF6/             # Reinforcement learning
│   ├── environment_14B8A6/    # Environnements RL
│   └── visualization_EC4899/  # Visualisation (plot, record_video)
├── core/
│   ├── graph.py               # Graphe orienté acyclique (DAG) + tri topologique
│   ├── generator.py           # Générateur de code Python à partir du DAG
│   ├── pipeline.py            # Exécution de pipeline (build_layer, run)
│   ├── block.py               # Registre de blocs (BlockMeta, BlockRegistry)
│   ├── config.py              # Validation de configurations JSON
│   └── vast.py                # Wrapper API Vast.ai (location/destruction GPU)
├── server/
│   ├── main.py                # Application FastAPI (lifespan, CORS, routers)
│   ├── routes.py              # Routes API REST (blocks, pipelines, jobs, validate)
│   ├── models.py              # Modèles SQLModel (Pipeline, Job, JobOutput, Profile)
│   ├── schemas.py             # Schémas Pydantic API (Block, Page, PipelineCreate...)
│   ├── database.py            # Engine PostgreSQL, session, init_db()
│   ├── auth.py                # Dépendance JWT Supabase (get_current_user)
│   └── gpu_auth.py            # Dépendance GPU API KEY (verify_gpu_key)
├── tests/                     # Tests unitaires et d'intégration
└── configs/                   # Exemples de configurations de pipelines (JSON)
```

---

## Définir un Bloc

Chaque bloc est une **fonction Python standard** dans un fichier `.py` rangé dans un dossier de catégorie :

```python
"""2D convolution layer for neural networks."""

from torch import nn


def conv2d(
    in_1: torch.Tensor,
    in_channels: int,
    out_channels: int,
    kernel_size: int = 3,
) -> torch.Tensor:
    """Applies a 2D convolution over an input signal.

    Args:
        in_1: Input tensor of shape (N, C_in, H, W).
        in_channels: Number of channels in the input image.
        out_channels: Number of channels produced by the convolution.
        kernel_size: Size of the convolving kernel (default 3).
    """
    return nn.Conv2d(in_channels, out_channels, kernel_size)(in_1)
```

Le discovery extrait automatiquement :
- Le nom de la fonction (`fn.__name__`)
- La description (docstring)
- Les paramètres (annotations de type + valeurs par défaut)
- Les dépendances packages (scanne les imports du fichier)
- La catégorie (extraite du nom du dossier)
- Le code source (stocké pour inlining dans le code généré)

### Convention des ports

| Port | Convention | Exemple |
|---|---|---|
| **Entrée** | `in_1`, `in_2`, ... | `in_1: torch.Tensor` |
| **Sortie** | `out_1`, `out_2`, ... | `-> torch.Tensor` → `out_1` |
| **Paramètre** | nom libre | `in_channels: int`, `kernel_size: int = 3` |

Le premier paramètre de tout bloc ML (le tenseur d'entrée) est toujours nommé `in_1`. Les sorties sont numérotées séquentiellement (`out_1`, `out_2`...) dans l'ordre d'exécution du pipeline.

---
## API REST

Toutes les routes utilisateur nécessitent un header `Authorization: Bearer <jwt>`.

### Formats des données

#### `GET /api/blocks` → Liste des blocs disponibles

**Réponse** :

```json
{
  "items": [
    {
      "name": "conv2d",
      "description": "Applies a 2D convolution...",
      "category": {"name": "neural", "color": "#6366F1"},
      "params": {
        "in_channels": {"type": "int", "description": "Number of channels", "default": null, "required": true},
        "out_channels": {"type": "int", "description": "Output channels", "default": null, "required": true},
        "kernel_size": {"type": "int", "description": "Kernel size", "default": 3, "required": false}
      },
      "outputs": [{"name": "out_1", "dtype": "torch.Tensor"}],
      "deps": ["torch"]
    }
  ],
  "total": 53,
  "page": 1,
  "size": 30
}
```

#### `POST /api/pipelines` → Créer une pipeline

**Body** :

```json
{
  "name": "CNN MNIST",
  "description": "Classification d'images",
  "nodes": [
    {"id": "n1", "type": "input",    "params": {"shape": [1, 28, 28]}},
    {"id": "n2", "type": "conv2d",   "params": {"in_channels": 1, "out_channels": 32, "kernel_size": 3}},
    {"id": "n3", "type": "relu",     "params": {}},
    {"id": "n4", "type": "flatten",  "params": {}},
    {"id": "n5", "type": "linear",   "params": {"in_features": 5408, "out_features": 10}},
    {"id": "n6", "type": "softmax",  "params": {"dim": 1}}
  ],
  "edges": [
    {"source": "n1", "source_port": "out_1", "target": "n2", "target_port": "in_1"},
    {"source": "n2", "source_port": "out_1", "target": "n3", "target_port": "in_1"},
    {"source": "n3", "source_port": "out_1", "target": "n4", "target_port": "in_1"},
    {"source": "n4", "source_port": "out_1", "target": "n5", "target_port": "in_1"},
    {"source": "n5", "source_port": "out_1", "target": "n6", "target_port": "in_1"}
  ]
}
```

**Champs Node** :
| Champ | Type | Description |
|---|---|---|
| `id` | string | Identifiant unique du nœud (généré par le frontend) |
| `type` | string | Nom du bloc (ex: `conv2d`, `relu`) |
| `params` | object | Paramètres utilisateur (clé → valeur) |

**Champ Edge** :
| Champ | Type | Description |
|---|---|---|
| `source` | string | ID du nœud source |
| `source_port` | string | Port de sortie (toujours `out_1` sauf multi-sorties) |
| `target` | string | ID du nœud cible |
| `target_port` | string | Port d'entrée (toujours `in_1`, `in_2`...) |

**Réponse** : `PipelineDetail` (voir ci-dessous)

#### `POST /api/pipelines/{id}/generate` → Preview du code

**Réponse** :

```json
{
  "code": "\"\"\"Generated by MLBlock.\"\"\"\n\nimport requests\n...\n\ndef main():\n    try:\n        out_1 = input(shape=[1, 28, 28])\n        out_2 = conv2d(in_1=out_1, in_channels=1, out_channels=32)\n        ..."
}
```

#### `POST /api/pipelines/{id}/execute` → Lancer sur GPU

**Réponse** :

```json
{
  "id": "uuid",
  "pipeline_id": "uuid",
  "user_id": "uuid",
  "status": "queued",
  "vast_instance_id": "12345",
  "created_at": "2026-07-15T10:00:00"
}
```

#### `POST /api/validate` → Valider un graphe

**Body** : même format que `PipelineCreate` (nodes + edges)

**Réponse** :

```json
{"valid": true, "errors": []}
```
ou
```json
{"valid": false, "errors": ["Unknown block type 'xyz' for node 'n1'"]}
```

#### `POST /api/jobs/{job_id}/status` → Callback GPU

**Body** :

```json
{"block": "conv2d", "status": "running"}
```
Valeurs de `status` : `"running"`, `"done"`, `"error"`

#### `POST /api/jobs/{job_id}/output` → Push résultat

**Body** :

```json
{"block": "conv2d", "output": "conv2d running on tensor of shape [1, 32, 26, 26]"}
```

#### `POST /api/jobs/{job_id}/error` → Rapporter erreur

**Body** :

```json
{"block": "conv2d", "error": "RuntimeError: shape mismatch"}
```

### Code généré

Le backend génère le code Python correspondant au DAG. Les variables suivent la convention :

```python
out_1 = input(shape=[1, 28, 28])                # sortie du 1er bloc
out_2 = conv2d(in_1=out_1, in_channels=1, ...)  # sortie du 2e bloc
out_3 = relu(in_1=out_2)                         # sortie du 3e bloc
out_4 = flatten(in_1=out_3)
out_5 = linear(in_1=out_4, in_features=5408, out_features=10)
out_6 = softmax(in_1=out_5, dim=1)
```

- **Entrées** : `in_1`, `in_2`, ... (port d'entrée générique)
- **Sorties** : `out_1`, `out_2`, ... (numérotées séquentiellement selon l'ordre d'exécution)
- **Paramètres** : passés directement en kwargs (`in_channels=1`, `kernel_size=3`)

Les blocs peuvent avoir des connexions **non-linéaires** : un bloc peut alimenter n'importe quel autre bloc en amont via le mécanisme d'edges.
