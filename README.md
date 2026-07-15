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
│   ├── vast.py                # Wrapper API Vast.ai (location/destruction GPU)
│   └── generator.py           # Génération de code avec notification GPU
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

Le discovery extrait automatiquement :
- Le nom de la fonction (`fn.__name__`)
- La description (docstring)
- Les paramètres (annotations de type + valeurs par défaut)
- Les dépendances packages (scanne les imports du fichier)
- La catégorie (extraite du nom du dossier)
- Le code source (stocké pour inlining dans le code généré)

---

## API REST

### Blocs

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/blocks` | Liste paginée des blocs (filtres `?category=`, `?q=`) |
| `GET` | `/api/blocks/categories` | Liste des catégories avec nombre de blocs |
| `GET` | `/api/blocks/{type_name}` | Détail d'un bloc |

### Pipelines

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/pipelines` | Liste des pipelines de l'utilisateur |
| `POST` | `/api/pipelines` | Création d'une pipeline (DAG nodes + edges) |
| `GET` | `/api/pipelines/{id}` | Détail d'une pipeline |
| `PUT` | `/api/pipelines/{id}` | Mise à jour d'une pipeline |
| `DELETE` | `/api/pipelines/{id}` | Suppression d'une pipeline |
| `POST` | `/api/pipelines/{id}/generate` | Preview du code généré (dry run) |
| `POST` | `/api/pipelines/{id}/execute` | Exécution sur GPU Vast.ai |
| `GET` | `/api/pipelines/{id}/jobs` | Historique des jobs d'une pipeline |
| `POST` | `/api/pipelines/{id}/build` | Construction du modèle PyTorch |

### Jobs & Callbacks GPU

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/jobs/{job_id}` | JWT | Détail d'un job |
| `POST` | `/api/jobs/{job_id}/status` | GPU key | Mise à jour du statut |
| `POST` | `/api/jobs/{job_id}/output` | GPU key | Push du résultat d'un bloc |
| `POST` | `/api/jobs/{job_id}/error` | GPU key | Rapporter une erreur |

### Validation

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/validate` | Validation d'un graphe (types, ports, cycles) |

---

## Exemple de Pipeline (JSON)

```json
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

Le backend calcule l'ordre d'exécution par **tri topologique** du graphe et génère le code Python correspondant :

```python
out_n1 = load_csv(path="ventes.csv")
out_n2_X_train, out_n2_y_train = train_test_split(data=out_n1, target_column="prix", test_size=0.2)
out_n3 = linear_regression(train_data=out_n2_X_train, train_target=out_n2_y_train)
```

Notre plateforme est conçue comme le Scratch de l'IA, permettant à chacun d'expérimenter le Machine Learning de manière visuelle et accessible.
