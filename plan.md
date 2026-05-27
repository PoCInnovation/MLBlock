# Plan d'Architecture — MLBlocks

## 1. Vision Globale

MLBlocks = **Scratch de l'IA**. L'utilisateur assemble des briques visuelles (glisser-déposer) pour construire des réseaux de neurones. Derrière le rideau, chaque brique correspond à un bloc PyTorch, et le système :

1. **Lit la config** (fichier JSON décrivant le graphe)
2. **Construit le modèle** PyTorch automatiquement
3. **Génère le code Python** lisible en sortie

---

## 2. Structure du Projet

```
mlblock/
├── __init__.py
├── core/                  ← Cœur du moteur
│   ├── __init__.py
│   ├── config.py          ← Charge et valide le JSON
│   ├── graph.py           ← Graphe orienté (nœuds + arêtes)
│   ├── block.py           ← Registre des briques disponibles
│   └── pipeline.py        ← Construit le modèle / génère le code
├── blocks/                ← Définitions des briques
│   ├── __init__.py
│   └── cnn.py             ← Briques CNN (Conv2D, Pool, ReLU, Linear…)
└── models/                ← Constructeurs haut niveau
    ├── __init__.py
    └── cnn.py             ← Helper pour construire un CNN depuis la config
configs/
└── cnn_mnist.json         ← Exemple de fichier de config
demo.py                    ← Script de démonstration
plan.md                    ← Ce fichier
```

---

## 3. Format du Fichier de Config (format Sacha)

Le fichier JSON décrit un **graphe orienté acyclique (DAG)** avec des **nœuds** et des **arêtes**.

### Nœud (Node)

```json
{
  "id": "conv1",
  "type": "conv2d",
  "params": {
    "in_channels": 1,
    "out_channels": 32,
    "kernel_size": 3
  },
  "ports": {
    "in":  [{ "name": "in",  "dtype": "Tensor" }],
    "out": [{ "name": "out", "dtype": "Tensor" }]
  }
}
```

- **id** : nom unique du nœud
- **type** : référence vers une brique enregistrée (`conv2d`, `relu`, `linear`…)
- **params** : les paramètres spécifiques à cette brique
- **ports** : les ports d'entrée/sortie (pour le typage et la validation)

### Arête (Edge)

```json
{ "source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in" }
```

Connecte la sortie `out` de `conv1` vers l'entrée `in` de `relu1`.

### Graphe complet

```json
{
  "graph": {
    "nodes": [ … ],
    "edges": [ … ]
  }
}
```

---

## 4. Système de Briques (Block)

Chaque type de brique a une **définition** (metadata) et une **fonction builder** qui construit le vrai module PyTorch.

### Définition d'une brique

```python
"conv2d": {
    "label": "Conv2D",              # Nom affiché dans l'UI
    "category": "cnn",              # Catégorie (cnn, rl, data…)
    "params": {
        "in_channels":  {"type": "int", "required": True},
        "out_channels": {"type": "int", "required": True},
        "kernel_size":  {"type": "int", "default": 3},
        "stride":       {"type": "int", "default": 1},
        "padding":      {"type": "int", "default": 0}
    },
    "inputs":  [{"name": "in",  "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": "self.{node_id} = nn.Conv2d({params.in_channels}, {params.out_channels}, ...)"
}
```

### Fonction builder associée

```python
def _build_conv2d(params):
    return nn.Conv2d(
        in_channels=params["in_channels"],
        out_channels=params["out_channels"],
        kernel_size=params.get("kernel_size", 3),
        stride=params.get("stride", 1),
        padding=params.get("padding", 0),
    )
```

À l'enregistrement, la brique et son builder sont stockés dans le **BlockRegistry**.

### Briques CNN disponibles

| Type | Ce qu'elle fait | Paramètres clés |
|------|----------------|-----------------|
| `input` | Déclare l'entrée du réseau | `shape` |
| `conv2d` | Convolution 2D | `in_channels`, `out_channels`, `kernel_size` |
| `maxpool2d` | Max pooling | `kernel_size` |
| `avgpool2d` | Average pooling | `kernel_size` |
| `relu` | Activation ReLU | — |
| `sigmoid` | Activation Sigmoid | — |
| `tanh` | Activation Tanh | — |
| `flatten` | Aplatit le tenseur | — |
| `linear` | Couche fully-connected | `in_features`, `out_features` |
| `dropout` | Dropout | `p` |
| `batchnorm2d` | Batch normalisation 2D | `num_features` |
| `softmax` | Softmax | `dim` |

---

## 5. Le Pipeline — 2 Modes de Sortie

### Mode 1 — Construction du modèle PyTorch

```
Config JSON → Graph → Pipeline.build_model() → nn.Sequential → prêt à entraîner
```

Le Pipeline :
1. **Valide** le graphe (pas de cycle, tous les nœuds existent)
2. **Trie topologiquement** les nœuds (ordre d'exécution)
3. **Itère** sur les nœuds dans l'ordre et appelle `block.build_layer(params)` pour chacun
4. **Assemble** le tout dans un `nn.Sequential`

```python
pipeline = Pipeline(graph)
model = pipeline.build_model()
output = model(torch.randn(1, 1, 28, 28))  # ✅ ça marche directement
```

### Mode 2 — Génération de code Python

```
Config JSON → Graph → Pipeline.generate_code() → fichier .py lisible
```

Le Pipeline :
1. Itère sur les nœuds dans l'ordre topologique
2. Pour chaque nœud, remplit le *template* avec les paramètres réels
3. Génère une classe `Model(nn.Module)` complète avec `__init__` et `forward`

```python
code = pipeline.generate_code()
print(code)
# → import torch
# → import torch.nn as nn
# → ...
# → class Model(nn.Module):
# →     def __init__(self):
# →         self.conv1 = nn.Conv2d(1, 32, kernel_size=3)
# →     def forward(self, x):
# →         x = self.conv1(x)
# →         return x
```

---

## 6. Exemple Complet Pas à Pas — CNN MNIST

### 6.1 Le fichier JSON (`configs/cnn_mnist.json`)

```json
{
  "graph": {
    "nodes": [
      { "id": "input_1", "type": "input",
        "params": { "shape": [1, 28, 28] },
        "ports": { "out": [{ "name": "out", "dtype": "Tensor" }] }
      },
      { "id": "conv1", "type": "conv2d",
        "params": { "in_channels": 1, "out_channels": 32, "kernel_size": 3 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "relu1", "type": "relu",
        "params": {},
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "pool1", "type": "maxpool2d",
        "params": { "kernel_size": 2 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "conv2", "type": "conv2d",
        "params": { "in_channels": 32, "out_channels": 64, "kernel_size": 3 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "relu2", "type": "relu",
        "params": {},
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "pool2", "type": "maxpool2d",
        "params": { "kernel_size": 2 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "flat", "type": "flatten",
        "params": {},
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "fc1", "type": "linear",
        "params": { "in_features": 1600, "out_features": 128 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "relu3", "type": "relu",
        "params": {},
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "fc2", "type": "linear",
        "params": { "in_features": 128, "out_features": 10 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      },
      { "id": "output", "type": "softmax",
        "params": { "dim": 1 },
        "ports": {
          "in":  [{ "name": "in", "dtype": "Tensor" }],
          "out": [{ "name": "out", "dtype": "Tensor" }]
        }
      }
    ],
    "edges": [
      { "source": "input_1", "source_port": "out", "target": "conv1", "target_port": "in" },
      { "source": "conv1", "source_port": "out", "target": "relu1", "target_port": "in" },
      { "source": "relu1", "source_port": "out", "target": "pool1", "target_port": "in" },
      { "source": "pool1", "source_port": "out", "target": "conv2", "target_port": "in" },
      { "source": "conv2", "source_port": "out", "target": "relu2", "target_port": "in" },
      { "source": "relu2", "source_port": "out", "target": "pool2", "target_port": "in" },
      { "source": "pool2", "source_port": "out", "target": "flat", "target_port": "in" },
      { "source": "flat", "source_port": "out", "target": "fc1", "target_port": "in" },
      { "source": "fc1", "source_port": "out", "target": "relu3", "target_port": "in" },
      { "source": "relu3", "source_port": "out", "target": "fc2", "target_port": "in" },
      { "source": "fc2", "source_port": "out", "target": "output", "target_port": "in" }
    ]
  }
}
```

### 6.2 Architecture du réseau

```
Input(1, 28, 28)
  ↓
Conv2D(1 → 32, kernel=3)  →  (32, 26, 26)
  ↓
ReLU
  ↓
MaxPool2D(2)               →  (32, 13, 13)
  ↓
Conv2D(32 → 64, kernel=3)  →  (64, 11, 11)
  ↓
ReLU
  ↓
MaxPool2D(2)               →  (64, 5, 5)
  ↓
Flatten                    →  1600
  ↓
Linear(1600 → 128)
  ↓
ReLU
  ↓
Linear(128 → 10)
  ↓
Softmax
  ↓
Output(10 classes)
```

### 6.3 Code généré

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class Model(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=0)
        self.pool1 = nn.MaxPool2d(kernel_size=2)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=0)
        self.pool2 = nn.MaxPool2d(kernel_size=2)
        self.flat = nn.Flatten()
        self.fc1 = nn.Linear(1600, 128, bias=True)
        self.fc2 = nn.Linear(128, 10, bias=True)

    def forward(self, x):
        x = self.conv1(x)
        x = F.relu(x)
        x = self.pool1(x)
        x = self.conv2(x)
        x = F.relu(x)
        x = self.pool2(x)
        x = self.flat(x)
        x = self.fc1(x)
        x = F.relu(x)
        x = self.fc2(x)
        return F.softmax(x, dim=1)
```

---

## 7. Comment Ajouter une Nouvelle Brique

C'est volontairement simple :

### Étape 1 — Définir la brique

Ajoute une entrée dans le dictionnaire `CNN_BLOCK_DEFS` dans `blocks/cnn.py` :

```python
"adaptiveavgpool2d": {
    "label": "AdaptiveAvgPool2D",
    "category": "cnn",
    "params": {
        "output_size": {"type": "int", "default": 1},
    },
    "inputs":  [{"name": "in",  "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": "self.{node_id} = nn.AdaptiveAvgPool2d({params.output_size})",
}
```

### Étape 2 — Créer le builder

```python
def _build_adaptiveavgpool2d(params):
    return nn.AdaptiveAvgPool2d(params.get("output_size", 1))
```

### Étape 3 — Enregistrer

Ajoute au dictionnaire `CNN_BUILDERS` :

```python
"adaptiveavgpool2d": _build_adaptiveavgpool2d,
```

**C'est tout.** La brique est immédiatement disponible dans les configs JSON.

---

## 8. Prochaines Étapes

### 8.1 Interface visuelle (le vrai "Scratch")

Le JSON est le format d'échange. L'interface visuelle (React/Electron ou Web) :
1. Affiche les briques disponibles par catégorie
2. Permet le glisser-déposer sur un canvas
3. Connecte les ports (entrée → sortie)
4. Sérialise en JSON → l'envoie au backend Python
5. Affiche le modèle construit et le code généré

### 8.2 Nouvelles catégories de briques

- **Vision** : `resize`, `normalize`, `random_crop`, `to_tensor`
- **RL (Reinforcement Learning)** : `policy_network`, `q_network`, `environment`
- **Data** : `load_csv`, `load_images`, `train_test_split`, `data_loader`
- **Training** : `loss_function`, `optimizer`, `train_loop`, `evaluate`

### 8.3 Architecture non-séquentielle

Le système de graphe supporte déjà les connexions arbitraires. Pour des architectures avancées (ResNet avec skip connections, modèles multi-entrées) :

- Le Pipeline actuel construit un `nn.Sequential` (linéaire)
- Un futur `GraphPipeline` pourrait construire un `nn.Module` personnalisé avec un forward qui suit les arêtes du graphe

### 8.4 Mini-jeux intégrés

- "Devine le bon paramètre" — jouer avec `kernel_size` et voir l'effet sur une image
- "Bataille de architectures" — comparer deux configs sur MNIST
- "Bac à sable" — espace libre pour expérimenter

---

## 9. Résumé du Flux

```
┌─────────────────────────────────────────────────────────────┐
│  UTILISATEUR                                                 │
│                                                              │
│  [Glisse-déposer des briques] → [Connecte les ports]         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Fichier JSON   │
              │  (config)       │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  ConfigLoader   │
              │  + validation   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Graph          │
              │  (nœuds + arêtes)│
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Pipeline       │
              │                  │
              │  2 sorties :    │
              │  ┌──────────┐   │
              │  │ Modèle   │   │  ← nn.Sequential prêt à entraîner
              │  │ PyTorch  │   │
              │  ├──────────┤   │
              │  │ Code     │   │  ← fichier .py généré
              │  │ Python   │   │
              │  └──────────┘   │
              └─────────────────┘
```

## 10. Dépendances

```
torch >= 2.0
```

Rien d'autre. Pas de framework web, pas de base de données. Le projet est minimaliste par design.
