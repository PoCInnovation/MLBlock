# MLBlock — Architecture

MLBlock est un environnement visuel type Scratch, spécialisé dans la construction de pipelines IA/ML. L'utilisateur assemble des blocs prédéfinis, ce qui génère un fichier `main.py` autonome exécutable.

## Stack technique

- **Langage :** Python 3.13+
- **Validation :** Pydantic v2 (tous les modèles, configurations, schémas)
- **Paradigme :** Programmation orientée objet (Factory, Registry, Strategy)
- **Exécution :** `subprocess.run` sur le `main.py` généré

## Deux paradigmes supportés

| Paradigme | Exécution | Exemple de pipeline |
|---|---|---|
| **Supervisé** | DAG — chaque nœud s'exécute une fois | load_csv → train_test_split → linear_regression → evaluate |
| **Renforcement (RL)** | Boucle encapsulée dans `model.learn()` | gym_env → train_rl → evaluate_rl |

Le système DAG gère les deux : les blocs RL encapsulent leurs boucles internes (via `model.learn()` de SB3) et restent des nœuds dans le graphe.

## Deux niveaux d'utilisation

| Niveau | Description |
|---|---|
| **Basique** | L'utilisateur pose des blocs prédéfinis (load_csv → train → evaluate) |
| **Avancé** | L'utilisateur ouvre un bloc et y place d'autres blocs (drill-down, 2 niveaux) |

## Flux d'exécution

```
pipeline.json
    │ (1) lire + parser JSON
    ▼
PipelineValidator (Pydantic)
    │ (2) valider structure + types + registry
    ▼
PipelineDef (modèle Pydantic propre)
    │ (3) ordonner + détecter cycles + résoudre nested
    ▼
list[ordonnée de nodes]
    │ (4) pour chaque nœud: résoudre vars, remplir template, try/except
    ▼
CodeGenerator
    │ (5) assembler imports + code complet
    ▼
main.py
    │ (6) exécuter avec subprocess
    ▼
stdout + score
```

## Structure du projet

```
mlblock/
├── __init__.py
├── __main__.py              # point d'entrée: python -m mlblock pipeline.json
│
├── models/                  # Modèles Pydantic (schémas, validation)
│   ├── __init__.py
│   ├── block_spec.py        # BlockSpec, ParamSpec, PortSpec
│   ├── pipeline.py          # PipelineDef, PipelineNode, PipelineEdge
│   └── registry.py          # BlockRegistry — conteneur de BlockSpec
│
├── core/                    # Moteur de pipeline
│   ├── __init__.py
│   ├── validator.py         # PipelineValidator — validation Pydantic + règles métier
│   ├── resolver.py          # DAGResolver — tri topologique, cycles, nested
│   ├── generator.py         # CodeGenerator — templates → main.py
│   └── executor.py          # PipelineExecutor — subprocess.run
│
├── blocks/                  # Définitions des blocs (auto-discover)
│   ├── __init__.py
│   ├── registry.py          # Auto-discover: parcourt les sous-dossiers, indexe les BLOCK
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── load_csv.py          # load_csv → DataFrame
│   │   └── train_test_split.py  # train_test_split → DataFrame, DataFrame
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── linear_regression.py
│   │   ├── logistic_regression.py
│   │   └── random_forest.py
│   │
│   ├── evaluation/
│   │   ├── __init__.py
│   │   └── evaluate.py          # Métriques (mse, rmse, r2, mae) → float
│   │
│   ├── rl/
│   │   ├── __init__.py
│   │   ├── gym_env.py           # Crée env Gymnasium → Environment
│   │   ├── single_env.py        # Env non vectorisé (gym.make seul)
│   │   ├── space_def.py         # Définit un espace (Discrete, Box, Dict...)
│   │   ├── wrappers.py          # normalize_obs, frame_stack, time_limit
│   │   ├── record_video.py      # RecordVideo wrapper
│   │   ├── train_rl.py          # Entraîne agent SB3 → RLModel
│   │   ├── evaluate_rl.py       # Évalue agent → float
│   │   ├── render_rl.py         # Joue un épisode avec rendu
│   │   └── custom_env.py        # Env custom complet avec classe gym.Env
│   │
│   ├── advanced/
│   │   ├── __init__.py
│   │   ├── auto_ml.py           # Bloc imbriqué personnalisé
│   │   └── code_block.py        # Injection de code Python brut
│   │
│   └── visualization/
│       ├── __init__.py
│       └── plot_predictions.py  # Graphique prédictions vs réelles
```

---

## 1. Modèles Pydantic — `models/`

### `block_spec.py`

```python
from pydantic import BaseModel, Field
from typing import Any, Literal

class ParamSpec(BaseModel):
    type: str                    # "str" | "float" | "int" | "bool"
    required: bool = False
    default: Any = None
    description: str = ""

class PortSpec(BaseModel):
    name: str
    dtype: str                   # "DataFrame" | "Model" | "float" | "Environment" | "RLModel" | ...

class BlockSpec(BaseModel):
    label: str
    category: str                # "data" | "models" | "evaluation" | "environment" | "rl" | "advanced" | "visualization"
    params: dict[str, ParamSpec]
    inputs: list[PortSpec]
    outputs: list[PortSpec]
    template: str                # string avec placeholders {input.X} {output.Y} {params.Z}
    children_allowed: bool = False
    generates_class: str | None = None   # nom de classe générée (ex: "MyCustomEnv")
    class_base: str | None = None        # classe parente (ex: "gym.Env")
```

### `pipeline.py`

```python
class PipelineNode(BaseModel):
    id: str
    type: str
    params: dict[str, Any] = {}
    children: list[PipelineNode] = Field(default_factory=list)

class PipelineEdge(BaseModel):
    source: str
    source_port: str
    target: str
    target_port: str

class PipelineDef(BaseModel):
    nodes: list[PipelineNode]
    edges: list[PipelineEdge]

    @model_validator(mode="after")
    def validate_types_in_registry(self, info: ValidationInfo):
        registry = info.context.get("registry")
        for node in self.nodes:
            if node.type not in registry:
                raise ValueError(f"Type de bloc inconnu: {node.type}")
        return self

    @model_validator(mode="after")
    def validate_edges(self, info: ValidationInfo):
        registry = info.context.get("registry")
        node_map = {n.id: n for n in self._all_nodes()}
        for edge in self.edges:
            for side, port_name in [("source", edge.source_port), ("target", edge.target_port)]:
                node = node_map[getattr(edge, side)]
                spec = registry[node.type]
                direction = "outputs" if side == "source" else "inputs"
                if not any(p.name == port_name for p in getattr(spec, direction)):
                    raise ValueError(
                        f"Port '{port_name}' introuvable sur {side} '{node.id}' ({node.type})"
                    )
        return self

    @model_validator(mode="after")
    def validate_dtype_compatibility(self, info: ValidationInfo):
        registry = info.context.get("registry")
        node_map = {n.id: n for n in self._all_nodes()}
        for edge in self.edges:
            src_node = node_map[edge.source]
            tgt_node = node_map[edge.target]
            src_spec = registry[src_node.type]
            tgt_spec = registry[tgt_node.type]
            src_dtype = next(p.dtype for p in src_spec.outputs if p.name == edge.source_port)
            tgt_dtype = next(p.dtype for p in tgt_spec.inputs if p.name == edge.target_port)
            if src_dtype != tgt_dtype:
                raise ValueError(
                    f"Type mismatch: {edge.source}.{edge.source_port} ({src_dtype}) → "
                    f"{edge.target}.{edge.target_port} ({tgt_dtype})"
                )
        return self

    def _all_nodes(self):
        """Parcourt récursivement les nœuds et leurs enfants."""
        result = []
        def walk(nodes):
            for n in nodes:
                result.append(n)
                walk(n.children)
        walk(self.nodes)
        return result
```

---

## 2. Block Registry — auto-discover

### Principe

Chaque bloc est un fichier Python indépendant dans un dossier par catégorie. Un **auto-discover** (`registry.py`) parcourt récursivement l'arborescence `blocks/`, importe chaque fichier, et indexe ceux qui exportent une constante `BLOCK`.

```python
# blocks/registry.py
import importlib
from pathlib import Path
from mlblock.models.block_spec import BlockSpec

BLOCK_REGISTRY: dict[str, BlockSpec] = {}
_KEY_SOURCE: dict[str, Path] = {}     # traçabilité fichier → clé

def _discover():
    pkg_dir = Path(__file__).parent
    for py_file in sorted(pkg_dir.rglob("*.py")):
        if py_file.name in ("__init__.py", "registry.py"):
            continue
        rel = py_file.relative_to(pkg_dir.parent)
        module_name = ".".join(rel.with_suffix("").parts)
        try:
            module = importlib.import_module(module_name)
            if hasattr(module, "BLOCK"):
                key = py_file.stem
                if key in BLOCK_REGISTRY:
                    raise KeyError(
                        f"Conflit: '{key}' défini dans {py_file} et {_KEY_SOURCE[key]}"
                    )
                BLOCK_REGISTRY[key] = module.BLOCK
                _KEY_SOURCE[key] = py_file
        except ImportError:
            pass  # dépendances manquantes, fichier ignoré

_discover()
```

**Conséquence :** créer un fichier = créer un bloc. Zéro ligne d'enregistrement à écrire.

**Exemple de fichier bloc :**
```python
# blocks/rl/gym_env.py
from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Créer un environnement Gymnasium",
    category="environment",
    params={
        "env_id": ParamSpec(type="str", required=True, ...),
        "n_envs": ParamSpec(type="int", default=4, ...),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template="from stable_baselines3.common.env_util import make_vec_env\n..."
)
```

### Convention de nommage

Le **nom du fichier** (sans `.py`) est l'identifiant du bloc, utilisé dans `pipeline.json` comme `node.type`. Il est immuable une fois publié — un renommage casse les pipelines existants.

### Blocs phase 1

| Bloc | Catégorie | Entrées | Sorties |
|---|---|---|---|
| `load_csv` | data | — | DataFrame |
| `train_test_split` | data | DataFrame | DataFrame, DataFrame |
| `linear_regression` | models | DataFrame | Model |
| `logistic_regression` | models | DataFrame | Model |
| `random_forest` | models | DataFrame | Model |
| `evaluate` | evaluation | Model, DataFrame | float |
| `plot_predictions` | visualization | Model, DataFrame | — |
| `gym_env` | environment | — | Environment |
| `single_env` | environment | — | Environment |
| `space_def` | environment | — | Space |
| `normalize_obs` | environment | Environment | Environment |
| `frame_stack` | environment | Environment | Environment |
| `time_limit` | environment | Environment | Environment |
| `record_video` | visualization | Environment | Environment |
| `train_rl` | rl | Environment | RLModel |
| `evaluate_rl` | rl | RLModel, Environment | float |
| `render_rl` | visualization | RLModel, Environment | — |
| `custom_env` | environment | — | Environment |
| `code_block` | advanced | (any) | (any) |
| `auto_ml` | advanced | (nested) | (nested) |

### Template — système de placeholders

Le template de chaque `BlockSpec` utilise 4 types de placeholders résolus par le `CodeGenerator` :

| Placeholder | Exemple | Résolution |
|---|---|---|
| `{input.X}` | `{input.dataset}` | Nom de variable = `node_id_nom_port` |
| `{output.X}` | `{output.train}` | Pareil, en cible d'affectation |
| `{params.X}` | `{params.path}` | Valeur littérale échappée |
| `{node_id}` | `{node_id}` | ID du nœud (ex: `node_3`) |

Certains blocs définissent des placeholders spéciaux résolus par le générateur :

| Bloc | Placeholder | Résolution |
|---|---|---|
| `evaluate` | `{metric_expr}` | Expression sklearn selon `params.method` |
| `evaluate` | `{plot_code}` | Code Matplotlib si `params.plot = True` |
| `space_def` | `{space_expr}` | Expression `spaces.X(...)` selon `params.space_type` |
| `evaluate_rl` | `{plot_code}` | Histogramme des récompenses si `params.plot_rewards = True` |

**Méthodes supportées pour evaluate :**

| method | metric_expr |
|---|---|
| `mse` | `mean_squared_error(y_test_{node_id}, y_pred_{node_id})` |
| `rmse` | `math.sqrt(mean_squared_error(y_test_{node_id}, y_pred_{node_id}))` |
| `r2` | `r2_score(y_test_{node_id}, y_pred_{node_id})` |
| `mae` | `mean_absolute_error(y_test_{node_id}, y_pred_{node_id})` |

**Graphique (plot=True) :**
```python
import matplotlib.pyplot as plt
plt.scatter(y_test_{node_id}, y_pred_{node_id}, alpha=0.5)
plt.xlabel("Vraies valeurs")
plt.ylabel("Prédictions")
plt.title("Prédictions vs Réelles - {params.method}")
plt.savefig("predictions_{node_id}.png")
plt.close()
```

---

## 3. Core — `core/`

### `validator.py` — PipelineValidator

```python
class PipelineValidator:
    def validate(self, raw: dict, registry: BlockRegistry) -> PipelineDef:
        # 1. Pydantic parse le JSON → PipelineDef
        #    (context = {"registry": registry} pour les model_validators)
        # 2. Les validateurs Pydantic vérifient:
        #    - types de blocs existent dans le registry
        #    - edges connectent des ports valides
        #    - dtypes compatibles entre ports source/target
        # 3. Retourne PipelineDef propre ou lève ValidationError
```

### `resolver.py` — DAGResolver

```python
class DAGResolver:
    def resolve(self, pipeline: PipelineDef) -> list[PipelineNode]:
        # 1. Tri topologique (algorithme de Kahn)
        # 2. Détection de cycles → ValueError descriptif
        # 3. Résout les blocs nested (children):
        #    - traite récursivement les sous-graphes
        #    - les variables des enfants sont préfixées
        #      (ex: node_1_sub_load_dataset)
        # 4. Retourne la liste plate et ordonnée des nœuds
```

### `generator.py` — CodeGenerator

```python
class CodeGenerator:
    def __init__(self, registry: BlockRegistry):
        self.registry = registry

    def generate(self, nodes: list[PipelineNode],
                 edges: list[PipelineEdge]) -> str:
        # 1. Construit un index edges par (source, source_port) → target
        # 2. Sépare les nœuds en deux catégories :
        #    - nœuds avec generates_class → _generate_class()
        #    - nœuds standards → template normal
        # 3. Pour chaque nœud standard dans l'ordre topologique:
        #    a. Récupère BlockSpec depuis le registry
        #    b. Résout les variables d'entrée:
        #       - pour chaque input de la spec, cherche l'edge entrant
        #       - si trouvé → var_name = edge.source + "_" + edge.source_port
        #       - si manquant mais que le port n'est pas requis → None
        #    c. Résout les variables de sortie: {node_id}_{port_name}
        #    d. Résout les params (typage: str → quotes, float/int/bool → littéral)
        #    e. Résout les placeholders conditionnels (metric_expr, plot_code, space_expr)
        #    f. Remplace tous les placeholders dans le template
        #    g. Entoure de try/except avec message d'erreur
        # 4. Pour chaque nœud generates_class :
        #    a. Rassemble les enfants par exec_location
        #    b. Injecte dans le squelette de classe
        #    c. Génère l'instanciation (make_vec_env(ClassName))
        # 5. Collecte tous les imports (déduplicatés)
        # 6. Assemble: docstring + imports + classes + fonction main() + if __name__
        # 7. Retourne le code complet
        pass

    def _generate_class(self, node: PipelineNode, spec: BlockSpec) -> str:
        """Génère une classe Python à partir d'un bloc avec generates_class."""
        children_by_location = {c.params.get("exec_location", "inline"): c
                                for c in node.children}
        # Remplit le squelette _CLASS_TEMPLATE avec le code des enfants
        pass

    def _resolve_var(self, node_id: str, port_name: str) -> str:
        """Mappe (node_id, port_name) → nom de variable Python."""
        return f"{node_id}_{port_name}"

    def _serialize_param(self, value: Any, param_type: str) -> str:
        """Sérialise un param pour injection dans le template."""
        if param_type == "str":
            escaped = str(value).replace("'", "\\'")
            return f"'{escaped}'"
        return str(value)

    def _dedup_imports(self, code: str) -> str:
        """Parse les lignes 'import X' / 'from X import Y' et déduplique."""
        seen = set()
        lines = []
        for line in code.split("\n"):
            stripped = line.strip()
            if stripped.startswith("import ") or stripped.startswith("from "):
                if stripped in seen:
                    continue
                seen.add(stripped)
            lines.append(line)
        return "\n".join(lines)

    def _wrap_try_except(self, node: PipelineNode, code: str, indent_size: int = 4) -> str:
        prefix = " " * indent_size
        wrapped = (
            f"try:\n"
            f"{prefix}# {node.type}: {node.id}\n"
        )
        for line in code.strip().split("\n"):
            wrapped += f"{prefix}{line}\n"
        wrapped += (
            f"except Exception as e:\n"
            f"{prefix}print(f\"[ERROR] {node.id} ({node.type}): {{e}}\")\n"
            f"{prefix}raise\n"
        )
        return wrapped
```

### `executor.py` — PipelineExecutor

```python
class PipelineExecutor:
    def run(self, main_py_path: str, timeout: int = 300) -> subprocess.CompletedProcess:
        # 1. subprocess.run([sys.executable, main_py_path], capture_output=True, text=True, timeout=timeout)
        # 2. Affiche stdout en temps réel (optionnel)
        # 3. Logge stderr si échec
        # 4. Retourne le CompletedProcess
        pass
```

---

## 4. Intégration RL / Gymnasium

### Problématique

Le pipeline supervisé est un **DAG séquentiel** (chaque nœud s'exécute une fois). Le RL est une **boucle** (agent-environnement sur des milliers de pas) :

```
Supervisé (DAG) :
  load_csv ──▶ train_test_split ──▶ linear_regression ──▶ evaluate
  (1 call)      (1 call)              (1 call .fit())       (1 call)

RL :
  env = gym.make("CartPole-v1")
  ┌──────────────────────────────────────────┐
  │  for _ in range(total_timesteps):        │
  │    action = model.predict(obs)           │
  │    obs, reward, done, _ = env.step(action)│
  │    model.learn(...)                      │
  └──────────────────────────────────────────┘
  evaluate_policy(model, env)
```

### Solution : encapsulation via SB3

Avec Stable-Baselines3, la boucle d'entraînement est encapsulée dans `model.learn()`. Les blocs RL restent des nœuds de DAG — ce sont leurs templates qui contiennent les boucles internes :

```
gym_env ──env──▶ train_rl ──model──▶ evaluate_rl
                  │
            model.learn()  ← boucle interne SB3
```

### Nouveaux dtypes

| dtype | Description | Cycle de vie |
|---|---|---|
| `Environment` | Objet Gymnasium vectorisé (`VecEnv`) | Créé par `gym_env`, consommé par `train_rl` et `evaluate_rl` |
| `RLModel` | Agent SB3 entraîné (PPO, DQN, SAC...) | Créé par `train_rl`, consommé par `evaluate_rl` |

### Nouveaux blocs

**`gym_env`** — Crée un environnement Gymnasium :
```python
BlockSpec(
    label="Créer un environnement Gymnasium",
    category="environment",
    params={
        "env_id": ParamSpec(type="str", required=True,
                            description="ID Gymnasium (ex: CartPole-v1, LunarLander-v3)"),
        "n_envs": ParamSpec(type="int", default=4,
                            description="Nombre d'environnements parallèles"),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.env_util import make_vec_env\n"
        "{output.env} = make_vec_env('{params.env_id}', n_envs={params.n_envs}"
        "{', seed=' + str(params.seed) if params.seed is not None else ''})"
    )
)
```

**`train_rl`** — Entraîne un agent RL :
```python
BlockSpec(
    label="Entraîner un agent RL",
    category="rl",
    params={
        "algorithm": ParamSpec(type="str", default="PPO",
                               description="PPO, DQN, SAC, A2C, TD3"),
        "total_timesteps": ParamSpec(type="int", default=100000),
        "learning_rate": ParamSpec(type="float", default=3e-4),
        "gamma": ParamSpec(type="float", default=0.99),
        "policy": ParamSpec(type="str", default="MlpPolicy"),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="model", dtype="RLModel")],
    template=(
        "from stable_baselines3 import {params.algorithm}\n"
        "import torch\n"
        "{output.model} = {params.algorithm}(\n"
        "    '{params.policy}',\n"
        "    {input.env},\n"
        "    learning_rate={params.learning_rate},\n"
        "    gamma={params.gamma},\n"
        "    verbose=1\n"
        "{', seed=' + str(params.seed) if params.seed is not None else ''})\n"
        "{output.model}.learn(total_timesteps={params.total_timesteps})\n"
        "{output.model}.save('{node_id}_{params.algorithm}')"
    )
)
```

**`evaluate_rl`** — Évalue un agent entraîné :
```python
BlockSpec(
    label="Évaluer un agent RL",
    category="rl",
    params={
        "n_episodes": ParamSpec(type="int", default=10,
                                description="Nombre d'épisodes d'évaluation"),
        "render": ParamSpec(type="bool", default=False),
        "plot_rewards": ParamSpec(type="bool", default=True,
                                  description="Histogramme des récompenses"),
    },
    inputs=[
        PortSpec(name="model", dtype="RLModel"),
        PortSpec(name="env", dtype="Environment"),
    ],
    outputs=[PortSpec(name="mean_reward", dtype="float")],
    template=(
        "from stable_baselines3.common.evaluation import evaluate_policy\n"
        "mean_reward_{node_id}, std_reward_{node_id} = evaluate_policy(\n"
        "    {input.model}, {input.env}, n_eval_episodes={params.n_episodes})\n"
        "{output.mean_reward} = mean_reward_{node_id}\n"
        "print(f\"[Évaluation] Récompense moyenne: {mean_reward_{node_id}:.2f} ± {std_reward_{node_id}:.2f}\")\n"
        "{plot_code}"
    )
)
```

**`render_rl`** — Joue un épisode avec rendu :
```python
BlockSpec(
    label="Jouer un épisode",
    category="visualization",
    params={
        "max_steps": ParamSpec(type="int", default=500),
    },
    inputs=[
        PortSpec(name="model", dtype="RLModel"),
        PortSpec(name="env", dtype="Environment"),
    ],
    outputs=[],
    template=(
        "import gymnasium as gym\n"
        "render_env_{node_id} = gym.make('{input.env}', render_mode='human')\n"
        "obs_{node_id}, _ = render_env_{node_id}.reset()\n"
        "for _ in range({params.max_steps}):\n"
        "    action_{node_id}, _ = {input.model}.predict(obs_{node_id})\n"
        "    obs_{node_id}, _, terminated_{node_id}, truncated_{node_id}, _ = render_env_{node_id}.step(action_{node_id})\n"
        "    if terminated_{node_id} or truncated_{node_id}:\n"
        "        break\n"
        "render_env_{node_id}.close()"
    )
)
```

### Nouveaux blocs RL avancés

**`single_env`** — Environnement non vectorisé (sans multiprocessing) :
```python
BlockSpec(
    label="Créer un environnement simple",
    category="environment",
    params={
        "env_id": ParamSpec(type="str", required=True,
                            description="ID Gymnasium (ex: CartPole-v1)"),
        "render_mode": ParamSpec(type="str", default=None,
                                 description="human, rgb_array, None"),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "import gymnasium as gym\n"
        "{output.env} = gym.make('{params.env_id}'"
        "{', render_mode=\"' + params.render_mode + '\"' if params.render_mode else ''})"
    )
)
```

**`space_def`** — Définir un espace Gymnasium (Discrete, Box, Dict) :
```python
BlockSpec(
    label="Définir un espace",
    category="environment",
    params={
        "space_type": ParamSpec(type="str", default="Discrete",
                                description="Discrete, Box, MultiBinary, MultiDiscrete, Dict"),
        "n": ParamSpec(type="int", default=None, description="Discrete: nombre d'actions"),
        "low": ParamSpec(type="str", default=None,
                         description="Box: valeurs min (JSON list, ex: [-1.0])"),
        "high": ParamSpec(type="str", default=None,
                          description="Box: valeurs max (JSON list, ex: [1.0])"),
        "shape": ParamSpec(type="str", default=None,
                           description="Box: shape (JSON list, ex: [4])"),
        "dtype": ParamSpec(type="str", default="float32",
                           description="Type numpy pour Box"),
    },
    inputs=[],
    outputs=[PortSpec(name="space", dtype="Space")],
    template=("{space_expr}")
)
```

Le placeholder `{space_expr}` est résolu par le générateur :

| space_type | code généré |
|---|---|
| `Discrete` | `spaces.Discrete(n={params.n})` |
| `Box` | `spaces.Box(low=np.array({params.low}), high=np.array({params.high}), dtype=np.{params.dtype})` |
| `MultiBinary` | `spaces.MultiBinary(n={params.n})` |
| `MultiDiscrete` | `spaces.MultiDiscrete(nvec=np.array({params.n}))` |

**`normalize_obs`** — Normalise observations/récompenses d'un environnement vectorisé :
```python
BlockSpec(
    label="Normaliser l'environnement",
    category="environment",
    params={
        "norm_obs": ParamSpec(type="bool", default=True),
        "norm_reward": ParamSpec(type="bool", default=False),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.vec_env import VecNormalize\n"
        "{output.env} = VecNormalize({input.env}, "
        "norm_obs={params.norm_obs}, norm_reward={params.norm_reward})"
    )
)
```

**`frame_stack`** — Empile les observations consécutives (essentiel pour Atari) :
```python
BlockSpec(
    label="Empiler les frames",
    category="environment",
    params={
        "n_stack": ParamSpec(type="int", default=4,
                             description="Nombre de frames à empiler"),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.vec_env import VecFrameStack\n"
        "{output.env} = VecFrameStack({input.env}, n_stack={params.n_stack})"
    )
)
```

**`time_limit`** — Limite la durée d'un épisode :
```python
BlockSpec(
    label="Limiter la durée d'épisode",
    category="environment",
    params={
        "max_episode_steps": ParamSpec(type="int", default=500),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from gymnasium.wrappers import TimeLimit\n"
        "{output.env} = TimeLimit({input.env}, "
        "max_episode_steps={params.max_episode_steps})"
    )
)
```

**`record_video`** — Enregistre une vidéo des épisodes :
```python
BlockSpec(
    label="Enregistrer une vidéo",
    category="visualization",
    params={
        "video_folder": ParamSpec(type="str", default="./videos"),
        "episode_trigger": ParamSpec(type="int", default=1,
                                     description="Enregistrer tous les N épisodes"),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from gymnasium.wrappers import RecordVideo\n"
        "{output.env} = RecordVideo({input.env}, "
        "video_folder='{params.video_folder}', "
        "episode_trigger=lambda x: x % {params.episode_trigger} == 0)"
    )
)
```

**`code_block`** — Injection de code Python brut. Utilisé comme enfant pour customiser des blocs :
```python
BlockSpec(
    label="Code personnalisé",
    category="advanced",
    params={
        "code": ParamSpec(type="str", required=True,
                          description="Code Python à injecter"),
        "exec_location": ParamSpec(type="str", default="inline",
                                   description="inline, init, reset, step, reward"),
    },
    inputs=[],
    outputs=[],
    template="{params.code}"
)
```

### Pipeline avec wrappers

```json
{
  "nodes": [
    { "id": "n1", "type": "gym_env",     "params": { "env_id": "Breakout-v0", "n_envs": 4 } },
    { "id": "n2", "type": "frame_stack",  "params": { "n_stack": 4 } },
    { "id": "n3", "type": "train_rl",     "params": { "algorithm": "DQN", "total_timesteps": 200000 } },
    { "id": "n4", "type": "evaluate_rl",  "params": { "n_episodes": 10 } }
  ],
  "edges": [
    { "source": "n1", "source_port": "env",    "target": "n2", "target_port": "env" },
    { "source": "n2", "source_port": "env",    "target": "n3", "target_port": "env" },
    { "source": "n3", "source_port": "model",  "target": "n4", "target_port": "model" },
    { "source": "n2", "source_port": "env",    "target": "n4", "target_port": "env" }
  ]
}
```

### Exemple de pipeline RL complet

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "gym_env",
      "params": { "env_id": "CartPole-v1", "n_envs": 4 }
    },
    {
      "id": "node_2",
      "type": "train_rl",
      "params": {
        "algorithm": "PPO",
        "total_timesteps": 50000,
        "learning_rate": 0.0003,
        "gamma": 0.99
      }
    },
    {
      "id": "node_3",
      "type": "evaluate_rl",
      "params": { "n_episodes": 10, "plot_rewards": true }
    }
  ],
  "edges": [
    { "source": "node_1", "source_port": "env",   "target": "node_2", "target_port": "env" },
    { "source": "node_2", "source_port": "model", "target": "node_3", "target_port": "model" },
    { "source": "node_1", "source_port": "env",   "target": "node_3", "target_port": "env" }
  ]
}
```

**`main.py` généré :**
```python
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3 import PPO
from stable_baselines3.common.evaluation import evaluate_policy
import matplotlib.pyplot as plt
import numpy as np

def main():
    try:
        # gym_env: node_1
        node_1_env = make_vec_env('CartPole-v1', n_envs=4)
    except Exception as e:
        print(f"[ERROR] node_1 (gym_env): {e}")
        raise

    try:
        # train_rl: node_2
        node_2_model = PPO('MlpPolicy', node_1_env,
                           learning_rate=0.0003, gamma=0.99, verbose=1)
        node_2_model.learn(total_timesteps=50000)
        node_2_model.save('node_2_PPO')
    except Exception as e:
        print(f"[ERROR] node_2 (train_rl): {e}")
        raise

    try:
        # evaluate_rl: node_3
        mean_reward_node_3, std_reward_node_3 = evaluate_policy(
            node_2_model, node_1_env, n_eval_episodes=10)
        node_3_mean_reward = mean_reward_node_3
        print(f"[Évaluation] Récompense moyenne: {mean_reward_node_3:.2f} ± {std_reward_node_3:.2f}")
    except Exception as e:
        print(f"[ERROR] node_3 (evaluate_rl): {e}")
        raise

if __name__ == "__main__":
    main()
```

### Pipeline mixte (supervisé + RL)

Les deux paradigmes peuvent coexister dans un même pipeline :

```json
{
  "nodes": [
    { "id": "n1", "type": "load_csv", "params": { "path": "results.csv" } },
    { "id": "n2", "type": "gym_env",  "params": { "env_id": "LunarLander-v3", "n_envs": 4 } },
    { "id": "n3", "type": "train_rl", "params": { "algorithm": "PPO", "total_timesteps": 100000 } },
    { "id": "n4", "type": "evaluate_rl", "params": { "n_episodes": 20 } },
    { "id": "n5", "type": "evaluate", "params": { "method": "mse", "target_column": "score" } }
  ],
  "edges": [
    { "source": "n1", "source_port": "dataset", "target": "n5", "target_port": "test_data" },
    { "source": "n2", "source_port": "env",     "target": "n3", "target_port": "env" },
    { "source": "n3", "source_port": "model",   "target": "n4", "target_port": "model" },
    { "source": "n2", "source_port": "env",     "target": "n4", "target_port": "env" }
  ]
}
```

### Niveau avancé : `custom_env` — génération de classe Gymnasium

Le bloc `custom_env` génère une **classe Python complète** héritant de `gym.Env`. C'est le mécanisme le plus puissant du niveau avancé : l'utilisateur assemble des enfants `code_block` qui remplissent les méthodes `__init__`, `reset`, `step` et la fonction de récompense.

**`custom_env`** — Définit un environnement Gymnasium complet :
```python
BlockSpec(
    label="Environnement personnalisé",
    category="environment",
    params={
        "env_name": ParamSpec(type="str", default="CustomEnv",
                              description="Nom de la classe"),
        "render_mode": ParamSpec(type="str", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template="",   # géré par le générateur (génère une classe, pas une expression)
    children_allowed=True,
    generates_class="CustomEnv",   # ← champ Pydantic pour la génération de classe
    class_base="gym.Env",
)
```

Les enfants `code_block` sont répartis par `exec_location` :

| exec_location | Emplacement dans la classe | Génère |
|---|---|---|
| `init` | `__init__` | Définition des espaces, initialisation des variables |
| `reset` | `reset()` | Code après `super().reset()`, prépare `self.state` |
| `step` | `step(action)` | Logique de transition d'état |
| `reward` | `step(action)` (fin) | Calcul de `reward` |
| `inline` | Généré en ligne dans `main()` | Code utilitaire hors classe |

**Exemple de pipeline `custom_env` complet :**

```json
{
  "nodes": [
    {
      "id": "n1",
      "type": "custom_env",
      "params": { "env_name": "MyCustomEnv" },
      "children": [
        { "id": "n1_init", "type": "code_block",
          "params": {
            "exec_location": "init",
            "code": "self.observation_space = spaces.Box(low=-1.0, high=1.0, shape=(4,), dtype=np.float32)\nself.action_space = spaces.Discrete(2)\nself.state = np.zeros(4, dtype=np.float32)"
          }
        },
        { "id": "n1_reset", "type": "code_block",
          "params": {
            "exec_location": "reset",
            "code": "self.state = np.zeros(4, dtype=np.float32)\nreturn self.state, {}"
          }
        },
        { "id": "n1_step", "type": "code_block",
          "params": {
            "exec_location": "step",
            "code": "self.state += action - 0.5\nterminated = bool(abs(self.state).mean() > 1.0)\ntruncated = False"
          }
        },
        { "id": "n1_reward", "type": "code_block",
          "params": {
            "exec_location": "reward",
            "code": "reward = 1.0 if abs(self.state).mean() < 0.5 else -1.0"
          }
        }
      ]
    },
    { "id": "n2", "type": "train_rl",
      "params": { "algorithm": "PPO", "total_timesteps": 50000 } },
    { "id": "n3", "type": "evaluate_rl",
      "params": { "n_episodes": 10 } }
  ],
  "edges": [
    { "source": "n1", "source_port": "env",   "target": "n2", "target_port": "env" },
    { "source": "n2", "source_port": "model", "target": "n3", "target_port": "model" },
    { "source": "n1", "source_port": "env",   "target": "n3", "target_port": "env" }
  ]
}
```

**`main.py` généré pour `custom_env` :**

```python
import gymnasium as gym
from gymnasium import spaces
import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.evaluation import evaluate_policy

class MyCustomEnv(gym.Env):
    metadata = {"render_modes": []}

    def __init__(self):
        super().__init__()
        self.observation_space = spaces.Box(low=-1.0, high=1.0, shape=(4,), dtype=np.float32)
        self.action_space = spaces.Discrete(2)
        self.state = np.zeros(4, dtype=np.float32)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.state = np.zeros(4, dtype=np.float32)
        return self.state, {}

    def step(self, action):
        self.state += action - 0.5
        terminated = bool(abs(self.state).mean() > 1.0)
        truncated = False
        reward = 1.0 if abs(self.state).mean() < 0.5 else -1.0
        return self.state, reward, terminated, truncated, {}

def main():
    try:
        # custom_env: n1
        n1_env = make_vec_env(MyCustomEnv, n_envs=1)
    except Exception as e:
        print(f"[ERROR] n1 (custom_env): {e}")
        raise

    try:
        # train_rl: n2
        n2_model = PPO('MlpPolicy', n1_env, learning_rate=0.0003, verbose=1)
        n2_model.learn(total_timesteps=50000)
    except Exception as e:
        print(f"[ERROR] n2 (train_rl): {e}")
        raise

    try:
        # evaluate_rl: n3
        mean_reward_n3, std_reward_n3 = evaluate_policy(n2_model, n1_env, n_eval_episodes=10)
        print(f"[Évaluation] Récompense moyenne: {mean_reward_n3:.2f} ± {std_reward_n3:.2f}")
    except Exception as e:
        print(f"[ERROR] n3 (evaluate_rl): {e}")
        raise

if __name__ == "__main__":
    main()
```

**Mécanisme de génération :** le `CodeGenerator` détecte un bloc avec `generates_class` et bascule en mode "génération de classe" au lieu de "génération d'expression". Les enfants sont regroupés par `exec_location` et injectés dans la classe via des templates de squelette :

```python
# CodeGenerator._generate_class()
_CLASS_TEMPLATE = """\
class {class_name}({class_base}):
    metadata = {{"render_modes": []}}

    def __init__(self):
        super().__init__()
{init_body}

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
{reset_body}
        return self.state, {{}}

    def step(self, action):
{step_body}
{reward_line}
        return self.state, reward, terminated, truncated, {{}}
"""
```

### Bilan de compatibilité

| Aspect | Compatible | Détail |
|---|---|---|
| Modèle DAG | ✅ | Chaque RL block reste un nœud de DAG |
| Validation Pydantic | ✅ | Nouveaux dtypes, mêmes validateurs |
| CodeGenerator | ✅ | Même système de templates, placeholders |
| Passage de données | ✅ | Variables Python entre nœuds (objets en mémoire) |
| Try/except | ✅ | Chaque nœud encapsulé pareil |
| Blocs imbriqués | ✅ | `custom_env` avec enfants |
| Exécution | ✅ | `subprocess.run` identique |

---

## 5. Génération de `main.py` — exemple supervisé

À partir du pipeline JSON d'exemple, le générateur produit :

```python
# Généré par MLBlock
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np
import math

def main():
    try:
        # load_csv: node_1
        node_1_dataset = pd.read_csv('data.csv')
    except Exception as e:
        print(f"[ERROR] node_1 (load_csv): {e}")
        raise

    try:
        # train_test_split: node_2
        node_2_train, node_2_test = train_test_split(
            node_1_dataset, train_size=0.8, shuffle=True)
    except Exception as e:
        print(f"[ERROR] node_2 (train_test_split): {e}")
        raise

    try:
        # linear_regression: node_3
        X_train_node_3 = node_2_train.drop('target', axis=1)
        y_train_node_3 = node_2_train['target']
        node_3_model = LinearRegression(fit_intercept=True).fit(
            X_train_node_3, y_train_node_3)
    except Exception as e:
        print(f"[ERROR] node_3 (linear_regression): {e}")
        raise

    try:
        # evaluate: node_4
        X_test_node_4 = node_2_test.drop('target', axis=1)
        y_test_node_4 = node_2_test['target']
        y_pred_node_4 = node_3_model.predict(X_test_node_4)
        node_4_score = mean_squared_error(y_test_node_4, y_pred_node_4)
        print(f"Score (mse): {node_4_score}")
    except Exception as e:
        print(f"[ERROR] node_4 (evaluate): {e}")
        raise

if __name__ == "__main__":
    main()
```

---

## 6. Gestion des blocs imbriqués (niveau avancé)

Deux types de blocs imbriqués :

| Bloc | Type d'enfants | Mécanisme |
|---|---|---|
| `auto_ml` | Nœuds de pipeline standards | Sous-pipeline DAG classique, variables préfixées |
| `custom_env` | `code_block` avec `exec_location` | Génération d'une classe `gym.Env` complète |

### auto_ml — sous-pipeline DAG

Un nœud avec `children_allowed = True` qui contient d'autres nœuds de pipeline :

```json
{
  "id": "node_5",
  "type": "auto_ml",
  "params": {},
  "children": [
    { "id": "sub_1", "type": "load_csv",
      "params": { "path": "data.csv" } },
    { "id": "sub_2", "type": "train_test_split",
      "params": { "ratio": 0.8 } },
    { "id": "sub_3", "type": "random_forest",
      "params": { "target_column": "target", "n_estimators": 100 } }
  ]
}
```

**Traitement :**
- Les enfants sont triés topologiquement comme un pipeline séparé
- Les variables sont préfixées : `node_5_sub_1_dataset`, `node_5_sub_2_train`
- Les ports d'entrée/sortie du parent sont déduits des ports exposés des enfants
- Le générateur traite récursivement : `_generate_nested(node, depth)`

## 8. Roadmap d'implémentation RL

| Lot | Blocs | Complexité | Dépendances |
|---|---|---|---|
| **1 — Wrappers** | `normalize_obs`, `time_limit`, `single_env` | Faible | Aucune |
| **2 — Espaces & Vidéo** | `space_def`, `record_video` | Faible | Lot 1 |
| **3 — Code injectable** | `code_block` (type enfant, exec_location) | Moyenne | Générateur (injection code brut) |
| **4 — Env custom** | `custom_env` (génération classe gym.Env) | Haute | Lots 2 + 3 |

**Détail Lot 3 :** Le `code_block` nécessite d'étendre le `CodeGenerator` pour :
1. Détecter les blocs avec `generates_class`
2. Regrouper les enfants par `exec_location`
3. Injecter le code dans le squelette de classe

---

## 9. Point d'entrée — `__main__.py`

```python
import json, sys
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.models.registry import BlockRegistry
from mlblock.core.validator import PipelineValidator
from mlblock.core.resolver import DAGResolver
from mlblock.core.generator import CodeGenerator
from mlblock.core.executor import PipelineExecutor

def main():
    # 1. Lecture du pipeline JSON
    path = sys.argv[1] if len(sys.argv) > 1 else "pipeline.json"
    with open(path) as f:
        raw = json.load(f)

    # 2. Initialisation
    registry = BlockRegistry(BLOCK_REGISTRY)

    # 3. Validation
    validator = PipelineValidator()
    pipeline = validator.validate(raw, registry)

    # 4. Résolution DAG
    resolver = DAGResolver()
    ordered_nodes = resolver.resolve(pipeline)

    # 5. Génération du code
    generator = CodeGenerator(registry)
    code = generator.generate(ordered_nodes, pipeline.edges)

    # 6. Écriture du fichier
    output_path = "main.py"
    with open(output_path, "w") as f:
        f.write(code)
    print(f"✅ Pipeline généré → {output_path}")

    # 7. Exécution
    executor = PipelineExecutor()
    result = executor.run(output_path)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)

if __name__ == "__main__":
    main()
```
