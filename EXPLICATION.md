# MLBlocks — Explication détaillée pas à pas

## Le problème

Tu veux créer un réseau de neurones (un CNN). Normalement tu fais ça (fichier écrit à la main) :

```python
import torch.nn as nn

class MonReseau(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(2)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3)
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(2)
        self.flat = nn.Flatten()
        self.fc1 = nn.Linear(1600, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.conv1(x)
        x = self.relu1(x)
        x = self.pool1(x)
        x = self.conv2(x)
        x = self.relu2(x)
        x = self.pool2(x)
        x = self.flat(x)
        x = self.fc1(x)
        x = self.relu2(x) 
        x = self.fc2(x)
        return x
```

**Problèmes :**
- Il faut tout écrire à la main
- Une faute de frappe et ça plante
- Il faut connaître PyTorch par cœur
- Pas évident pour un débutant

**La solution MLBlocks :** on décrit le réseau dans un fichier JSON (simple, lisible), et le système construit tout tout seul.

---

## 1. Le principe : un jeu de construction

Le code source complet est dans le dossier `mlblock/`. Voici les fichiers que tu peux ouvrir pour tout voir :

| Fichier | Ce qu'il contient |
|---------|------------------|
| `mlblock/core/config.py` | Chargement et validation du JSON |
| `mlblock/core/graph.py` | Graphe (nœuds + arêtes) |
| `mlblock/core/block.py` | Registre des briques |
| `mlblock/core/pipeline.py` | Construction du modèle PyTorch |
| `mlblock/blocks/cnn.py` | Définition de toutes les briques CNN |
| `mlblock/models/cnn.py` | Fonction pratique "tout-en-un" |
| `configs/cnn_mnist.json` | Exemple de fichier de configuration |

**Ouvrir un fichier dans VS Code :** `code mlblock/core/config.py` (ou double-clique dans l'explorateur).

Imagine des **briques Lego**. Chaque brique fait une chose précise :
- 🧱 `conv2d` = fait une convolution
- 🧱 `relu` = applique ReLU
- 🧱 `maxpool2d` = réduit la taille de l'image
- 🧱 `linear` = couche fully-connected
- 🧱 `flatten` = aplatit en un seul vecteur
- 🧱 `softmax` = donne des probabilités en sortie

Tu **assembles** ces briques en précisant comment elles se connectent. C'est exactement comme un schéma :

```
Entrée (image 28×28)
    ↓
┌──────────┐
│  Conv2D  │  ← une brique
│  (1→32)  │
└────┬─────┘
     ↓
┌──────────┐
│   ReLU   │
└────┬─────┘
     ↓
┌──────────┐
│ MaxPool  │
│  (2×2)   │
└────┬─────┘
     ↓
   ... etc ...
     ↓
┌──────────┐
│ Softmax  │
└──────────┘
    ↓
Sortie (10 classes)
```

---

## 2. Le fichier JSON (la "recette" du réseau)

Le fichier JSON décrit **quoi** mettre et **comment** le connecter.

### 2.1 Une brique = un nœud (node)

```json
{
    "id": "conv1",              ← nom de la brique (tu choisis)
    "type": "conv2d",           ← type de brique (parmi celles disponibles)
    "params": {                 ← réglages de cette brique
        "in_channels": 1,
        "out_channels": 32,
        "kernel_size": 3
    },
    "ports": {                  ← ports de connexion (entrée/sortie)
        "in":  [{ "name": "in",  "dtype": "Tensor" }],
        "out": [{ "name": "out", "dtype": "Tensor" }]
    }
}
```

**Traduction en français :**
> "Je crée une brique appelée `conv1` qui est une `conv2d`.  
> Elle prend 1 canal en entrée, produit 32 canaux en sortie, avec un filtre de taille 3×3.  
> Elle a un port d'entrée appelé `in` et un port de sortie appelé `out`."

### 2.2 La connexion = une arête (edge)

```json
{
    "source": "conv1",
    "source_port": "out",
    "target": "relu1",
    "target_port": "in"
}
```

**Traduction :**
> "Je connecte la sortie `out` de la brique `conv1` vers l'entrée `in` de la brique `relu1`."

### 2.3 Le fichier complet

On met tous les nœuds et toutes les arêtes ensemble :

```json
{
    "graph": {
        "nodes": [ ... liste des briques ... ],
        "edges": [ ... liste des connexions ... ]
    }
}
```

**Fichier réel** → `configs/cnn_mnist.json` (ligne 1 à 96)

---

## 3. Comment le système fonctionne (derrière le rideau)

Quand tu lances le programme, voici ce qui se passe étape par étape :

### Étape 1 : Chargement du fichier → `mlblock/core/config.py:12`

```python
class ConfigLoader:
    def load(self) -> dict[str, Any]:    # ligne 16
        raw = self.path.read_text(...)
        self.data = json.loads(raw)
        return self.data

    @staticmethod
    def validate(graph_data):             # ligne 23
        # Vérifie que "nodes" et "edges" existent
        # Vérifie que chaque node a "id" et "type"
```

- Ouvre le fichier
- Vérifie qu'il y a des `nodes` et des `edges`
- Vérifie que chaque nœud a un `id` et un `type`

### Étape 2 : Construction du graphe → `mlblock/core/graph.py`

Deux classes :

**`GraphNode`** (ligne 8) :
```python
class GraphNode:
    def __init__(self, node_def):        # ligne 11
        self.id = node_def["id"]
        self.type = node_def["type"]
        self.params = node_def.get("params", {})
        # Va chercher la brique dans le registre :
        self.block = BlockRegistry.get(self.type)
```

**`Graph`** (ligne 33) :
```python
class Graph:
    def _build(self, graph_data):        # ligne 40
        # Pour chaque nœud du JSON → crée un GraphNode
        # Pour chaque arête du JSON → crée un Edge
```

- Crée un objet `GraphNode` pour chaque nœud du JSON
- Chaque nœud regarde son `type` (ex: `"conv2d"`) et va chercher la brique correspondante dans le **registre**
- Crée un objet `Edge` pour chaque connexion

**Le registre** (`BlockRegistry`) → `mlblock/core/block.py:35`

```python
class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}   # ligne 37 — la boîte à briques

    @classmethod
    def register(cls, name, definition, build_fn=None):  # ligne 39
        cls._blocks[name] = BlockMeta(name, definition, build_fn)

    @classmethod
    def get(cls, name):                   # ligne 47
        return cls._blocks.get(name)      # "donne-moi la brique 'conv2d'"
```

C'est la boîte qui contient toutes les briques disponibles :
```
"conv2d"    → sait construire un nn.Conv2d    (builder dans cnn.py:127)
"relu"      → sait construire un nn.ReLU      (builder dans cnn.py:137)
"linear"    → sait construire un nn.Linear    (builder dans cnn.py:145)
...
```

### Étape 3 : Vérification et ordonnancement → `mlblock/core/graph.py:60`

```python
def topological_sort(self):               # ligne 60
    # Ordonne les nœuds : input_1, conv1, relu1, pool1, ...
    ...

def validate(self):                       # ligne 85
    for edge in self.edges:
        if edge.source not in self.nodes:
            raise ValueError(...)          # une arête pointe vers rien !
    self.topological_sort()                # vérifie qu'il n'y a pas de cycle
```

Le système vérifie :
- Toutes les connexions pointent vers des nœuds qui existent ✅
- Il n'y a pas de cercle vicieux (A→B→C→A) ✅

Ensuite il **ordonne** les nœuds dans le bon ordre d'exécution :
```
input_1 (1er)
conv1 (2e, besoin de input_1)
relu1 (3e, besoin de conv1)
pool1 (4e, besoin de relu1)
...
```

### Étape 4 : Construction du modèle → `mlblock/core/pipeline.py:10`

```python
class Pipeline:
    def build_model(self) -> nn.Module:   # ligne 15
        self._order = self.graph.topological_sort()  # ordre des nœuds
        layers = []
        for node_id in self._order:
            node = self.graph.nodes[node_id]
            layer = self._build_node(node)           # construit UNE couche
            if layer is not None:
                layers.append(layer)
        return nn.Sequential(*layers)                # assemblage final

    def _build_node(self, node):           # ligne 24
        return node.block.build_layer(node.params)   # → nn.Conv2d(1,32,3)
```

Pour chaque nœud dans l'ordre :
1. Prend la brique (ex: `conv2d`)
2. Appelle sa fonction **builder** avec les paramètres
3. La builder crée le vrai module PyTorch (`nn.Conv2d(1, 32, 3)`)
4. Ajoute ce module à la liste

Résultat : un `nn.Sequential` tout prêt à être utilisé.

```python
model = build_cnn_from_config("configs/cnn_mnist.json")
output = model(mon_image)  # ✅ ça marche !
```

**Fonction pratique "tout-en-un"** → `mlblock/models/cnn.py:10`

```python
def build_cnn_from_config(config_path):
    loader = ConfigLoader(config_path)     # 1. charge le JSON
    data = loader.load()
    graph = Graph(data.get("graph", data)) # 2. construit le graphe
    pipeline = Pipeline(graph)             # 3. crée le pipeline
    return pipeline.build_model()          # 4. construit le modèle
```

---

## 4. Exemple concret avec le fichier `configs/cnn_mnist.json` (ligne 1 à 96)

Le fichier de config est dans `configs/cnn_mnist.json`. Tu peux l'ouvrir et le modifier pour changer l'architecture du réseau — c'est le seul fichier à toucher pour créer un nouveau modèle.

### Ce que contient le JSON

```
Nœuds :
  input_1  (type: input)     → déclare l'entrée (image 1×28×28)
  conv1    (type: conv2d)    → Conv2D: 1 → 32, kernel 3
  relu1    (type: relu)      → ReLU
  pool1    (type: maxpool2d) → MaxPool 2×2
  conv2    (type: conv2d)    → Conv2D: 32 → 64, kernel 3
  relu2    (type: relu)      → ReLU
  pool2    (type: maxpool2d) → MaxPool 2×2
  flat     (type: flatten)   → aplatit
  fc1      (type: linear)    → 1600 → 128
  relu3    (type: relu)      → ReLU
  fc2      (type: linear)    → 128 → 10
  output   (type: softmax)   → Softmax

Connexions :
  input_1 → conv1 → relu1 → pool1 → conv2 → relu2 → pool2 → flat → fc1 → relu3 → fc2 → output
```

### Ce que ça construit

```
Entrée (1, 28, 28)
    │
    ▼
Conv2D(1→32, 3×3)   →  (32, 26, 26)    [la convolution réduit un peu la taille]
    │
    ▼
ReLU                  →  (32, 26, 26)    [ne change pas la taille]
    │
    ▼
MaxPool(2×2)          →  (32, 13, 13)    [divise la taille par 2]
    │
    ▼
Conv2D(32→64, 3×3)   →  (64, 11, 11)
    │
    ▼
ReLU                  →  (64, 11, 11)
    │
    ▼
MaxPool(2×2)          →  (64, 5, 5)      [13//2 = 6, puis -2+1 = 5...]
    │
    ▼
Flatten               →  (1600)           [64 × 5 × 5 = 1600]
    │
    ▼
Linear(1600→128)      →  (128)
    │
    ▼
ReLU                  →  (128)
    │
    ▼
Linear(128→10)        →  (10)
    │
    ▼
Softmax               →  (10)            [probabilités pour 10 classes]
```

### Ce que le programme affiche quand on lance `demo.py`

Le script de démo est dans `demo.py`. Il appelle `build_cnn_from_config()`.

```
Building model from config...
Sequential(
  (0): Conv2d(1, 32, kernel_size=3, stride=1)      ← brique conv1
  (1): ReLU()                                        ← brique relu1
  (2): MaxPool2d(kernel_size=2)                      ← brique pool1
  (3): Conv2d(32, 64, kernel_size=3)                ← brique conv2
  (4): ReLU()                                        ← brique relu2
  (5): MaxPool2d(kernel_size=2)                      ← brique pool2
  (6): Flatten()                                     ← brique flat
  (7): Linear(1600 → 128)                            ← brique fc1
  (8): ReLU()                                        ← brique relu3
  (9): Linear(128 → 10)                              ← brique fc2
  (10): Softmax(dim=1)                               ← brique output
)

Input shape:  torch.Size([1, 1, 28, 28])
Output shape: torch.Size([1, 10])                   ← résultat : 10 probabilités
```

---

### Différence entre `core/` et `models/`

C'est simple :

| Dossier | Rôle | Analogie |
|---------|------|----------|
| `mlblock/core/` | Le **moteur générique** — il sait charger un JSON, construire un graphe, gérer un registre de briques, exécuter un pipeline | Le **moteur de voiture** (utilisable pour n'importe quelle voiture) |
| `mlblock/models/` | Les **fonctions pratiques spécifiques** — par exemple "construis un CNN depuis ce fichier JSON" | Le **volant + pédales** (l'interface que tu utilises vraiment) |

**`core/` est générique :** il ne sait pas ce qu'est un CNN. Il sait juste manipuler des graphes et des briques. Tu pourrais t'en servir pour faire du NLP, du RL, ou n'importe quoi d'autre.

**`models/` est spécifique :** il utilise `core/` pour offrir des fonctions faciles comme `build_cnn_from_config()`. C'est la couche "tout-en-un".

**Chaîne d'appel :**
```
demo.py  →  models/cnn.py  →  core/config.py
                           →  core/graph.py
                           →  core/pipeline.py
                                    →  core/block.py (BlockRegistry)
```

**Si on ajoutait un modèle NLP un jour :**
```
models/
├── cnn.py          (existant)
└── nlp.py          (nouveau)  → utilise le même core/ sans y toucher
```

Le `core/` reste inchangé. On crée juste un nouveau fichier dans `models/`.

---

## 5. Le rôle de chaque fichier (avec les numéros de ligne)

```
mlblock/
│
├── __init__.py (ligne 1)                    ← Quand on importe mlblock, toutes les briques sont enregistrées
│
├── core/                                    ← Le cerveau
│   ├── config.py                            ← Charge et valide le JSON
│   │   ├── class ConfigLoader        (ligne 12)
│   │   ├── def load()                (ligne 16)  → lit le fichier
│   │   └── def validate()            (ligne 23)  → vérifie le format
│   │
│   ├── graph.py                              ← Transforme le JSON en graphe
│   │   ├── class GraphNode           (ligne 8)   → un nœud = une brique
│   │   ├── class Edge                (ligne 23)  → une connexion
│   │   ├── class Graph               (ligne 33)  → le graphe complet
│   │   ├── def topological_sort()    (ligne 60)  → ordonne les nœuds
│   │   └── def validate()            (ligne 85)  → vérifie le graphe
│   │
│   ├── block.py                              ← Le registre de briques
│   │   ├── class BlockMeta          (ligne 8)   → métadonnées d'une brique
│   │   ├── class BlockRegistry      (ligne 35)  → la boîte qui contient tout
│   │   └── def register()           (ligne 39)  → ajoute une brique
│   │
│   └── pipeline.py                           ← Construit le modèle PyTorch
│       ├── class Pipeline           (ligne 10)
│       └── def build_model()        (ligne 15)  → construit nn.Sequential
│
├── blocks/                                   ← Les briques elles-mêmes
│   └── cnn.py (ligne 1 à 170)                ← 12 briques CNN
│       ├── CNN_BLOCK_DEFS          (ligne 8)   → définitions des briques
│       ├── CNN_BUILDERS            (ligne 127) → fonctions builders
│       └── register_cnn_blocks()   (ligne 167) → enregistre tout
│
├── models/                                   ← Fonction pratique
│   └── cnn.py (ligne 1 à 30)
│       └── build_cnn_from_config() (ligne 10)  → tout-en-un
│
├── configs/
│   └── cnn_mnist.json (ligne 1 à 96)         ← Exemple de config
│
├── demo.py (ligne 1 à 30)                    ← Script de démonstration
│
├── plan.md                                   ← Plan d'architecture
└── EXPLICATION.md                             ← Ce fichier (toi ici)
```

---

## 6. Comment ajouter une nouvelle brique (exemple : Dropout)

**Où ?** Dans `mlblock/blocks/cnn.py`.

La dropout existe déjà (ligne 101-110), mais on va prendre un autre exemple : **AdaptiveAvgPool2d** pour voir comment faire.

### Étape 1 : Ajoute la définition dans `CNN_BLOCK_DEFS` (ligne 8)

Ouvre `mlblock/blocks/cnn.py` et ajoute dans le dictionnaire `CNN_BLOCK_DEFS` (vers la ligne 115) :

```python
"adaptiveavgpool2d": {
    "label": "AdaptiveAvgPool2D",
    "category": "cnn",
    "params": {
        "output_size": {"type": "int", "default": 1},
    },
    "inputs":  [{"name": "in",  "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
}
```

### Étape 2 : Ajoute la fonction builder (vers la ligne 160)

```python
def _build_adaptiveavgpool2d(params):
    return nn.AdaptiveAvgPool2d(params.get("output_size", 1))
```

### Étape 3 : Enregistre dans `CNN_BUILDERS` (vers la ligne 175)

```python
"adaptiveavgpool2d": _build_adaptiveavgpool2d,
```

### Étape 4 : Utilise-la dans un JSON

```json
{
    "id": "my_pool",
    "type": "adaptiveavgpool2d",
    "params": { "output_size": 1 },
    "ports": {
        "in":  [{ "name": "in",  "dtype": "Tensor" }],
        "out": [{ "name": "out", "dtype": "Tensor" }]
    }
}
```

**C'est tout.** Maintenant tu peux utiliser `"type": "adaptiveavgpool2d"` dans n'importe quel JSON.

---

## 7. L'approche OOP (Object-Oriented Programming) expliquée

Chaque concept du programme est représenté par une **classe**. Voici pourquoi.

### 7.1 Pourquoi des classes ? (vs fonctions seules)

Sans OOP, on aurait tout écrit dans un gros script :

```python
# ❌ Version sans OOP — tout est mélangé
def charger_json(path): ...
def valider_graphe(data): ...
def construire_noeud(defn): ...
def trier_noeuds(noeuds, aretes): ...
def construire_modele(noeuds): ...
def generer_code(noeuds): ...
```

**Problème :** toutes les fonctions se balancent des dictionnaires, on ne sait plus qui modifie quoi, c'est le bordel.

**Avec OOP,** chaque classe a SA responsabilité et SES données. C'est comme des tiroirs rangés.

---

### 7.2 Les 7 classes du projet

```
┌────────────────────────────────────────────────────────────┐
│                   Les 7 classes                             │
│                                                             │
│  ConfigLoader   GraphNode   Edge   Graph   BlockMeta        │
│  BlockRegistry  Pipeline                                     │
└────────────────────────────────────────────────────────────┘
```

### Classe 1 : `ConfigLoader` — `core/config.py:6`

```python
class ConfigLoader:
    def __init__(self, path):        # constructeur : on donne le chemin
        self.path = Path(path)
        self.data = {}

    def load(self) -> dict:           # méthode : charge le fichier
        self.data = json.loads(...)
        return self.data

    @staticmethod
    def validate(data):               # méthode statique : vérifie le format
        ...
```

**Rôle :** ouvre le fichier JSON et vérifie qu'il est bien formé.

**Pourquoi une classe ?** Parce que le **chemin** et les **données chargées** sont liés. Sans classe, il faudrait passer le chemin à chaque appel de fonction.

---

### Classe 2 : `GraphNode` — `core/graph.py:9`

```python
class GraphNode:
    def __init__(self, node_def):     # constructeur : reçoit un dict du JSON
        self.id = node_def["id"]       # ex: "conv1"
        self.type = node_def["type"]   # ex: "conv2d"
        self.params = node_def.get("params", {})  # ex: {"in_channels": 1}
        self.block = BlockRegistry.get(self.type) # va chercher la brique

    def __repr__(self):
        return f"GraphNode({self.id}: {self.type})"
```

**Rôle :** représente UNE brique dans le graphe.

**Ce qu'elle contient :**
- `self.id` : son nom (`"conv1"`)
- `self.type` : son type (`"conv2d"`)
- `self.params` : ses réglages (`{"in_channels": 1, ...}`)
- `self.block` : la brique correspondante dans le registre

**Pourquoi une classe ?** Parce qu'un nœud a des **attributs liés** (id + type + params + block). Sans classe, on aurait 4 dictionnaires séparés à synchroniser.

---

### Classe 3 : `Edge` — `core/graph.py:22`

```python
class Edge:
    def __init__(self, edge_def):
        self.source = edge_def["source"]       # "conv1"
        self.source_port = edge_def["source_port"]  # "out"
        self.target = edge_def["target"]       # "relu1"
        self.target_port = edge_def["target_port"]   # "in"

    def __repr__(self):
        return f"Edge({self.source}.{self.source_port} → {self.target}.{self.target_port})"
```

**Rôle :** représente UNE connexion entre deux briques.

**Pourquoi une classe ?** Pour être sûr qu'une connexion a TOUJOURS ses 4 infos (source, source_port, target, target_port). Impossible d'en oublier un.

---

### Classe 4 : `Graph` — `core/graph.py:33`

```python
class Graph:
    def __init__(self, graph_data):
        self.nodes: dict[str, GraphNode] = {}    # dictionnaire de nœuds
        self.edges: list[Edge] = []               # liste de connexions
        self._build(graph_data)                   # construit tout

    def _build(self, graph_data):
        # Pour chaque élément du JSON, crée un GraphNode ou un Edge

    def topological_sort(self) -> list[str]:
        # Ordonne les nœuds : ["input_1", "conv1", "relu1", ...]

    def validate(self):
        # Vérifie que le graphe est correct (pas de cycles)
```

**Rôle :** contient TOUT le réseau (tous les nœuds + toutes les arêtes).

**Composition :** un `Graph` a des `GraphNode`s et des `Edge`s → c'est l'idée qu'un objet peut être composé d'autres objets.

**Pourquoi une classe ?** Parce que le graphe doit :
1. **Construire** ses éléments internes (`_build`)
2. **Valider** qu'ils sont cohérents (`validate`)
3. **Ordonner** les nœuds (`topological_sort`)
4. **Répondre** à des questions (`get_input_nodes`, `get_output_nodes`)

Tout ça partage les données (`self.nodes`, `self.edges`).

---

### Classe 5 : `BlockMeta` — `core/block.py:8`

```python
class BlockMeta:
    def __init__(self, name, definition, build_fn=None):
        self.name = name
        self.label = definition.get("label", name)
        self.category = definition.get("category", "default")
        self.params = definition.get("params", {})        # schéma des paramètres
        self.inputs = definition.get("inputs", [])         # ports d'entrée
        self.outputs = definition.get("outputs", [])       # ports de sortie
        self._build_fn = build_fn                          # fonction qui construit le module

    def build_layer(self, params):
        # Appelle la fonction builder pour créer un vrai nn.Module
        return self._build_fn(params)
```

**Rôle :** contient la **définition** d'une brique (son nom, ses paramètres) et sa **fonction builder**.

**Pourquoi une classe ?** `BlockMeta` est un **objet valeur** qui regroupe toutes les infos d'une brique. C'est la "carte d'identité" d'un type de brique.

---

### Classe 6 : `BlockRegistry` — `core/block.py:32`

```python
class BlockRegistry:
    _blocks: dict[str, BlockMeta] = {}       # variable de CLASSE (partagée par tous)

    @classmethod
    def register(cls, name, definition, build_fn=None):
        cls._blocks[name] = BlockMeta(...)    # ajoute une brique

    @classmethod
    def get(cls, name) -> BlockMeta | None:
        return cls._blocks.get(name)           # récupère une brique par son nom

    @classmethod
    def list(cls) -> list[str]:
        return list(cls._blocks.keys())        # liste toutes les briques
```

**Rôle :** c'est la "boîte à briques" qui contient TOUS les types de briques disponibles.

**Pattern Singleton :** `_blocks` est une **variable de classe** (pas d'instance). Peu importe combien d'objets `BlockRegistry` on crée, le dictionnaire `_blocks` est partagé. C'est un registre global.

**Méthodes de classe (`@classmethod`) :** on peut appeler `BlockRegistry.register(...)` ou `BlockRegistry.get("conv2d")` sans avoir à créer d'instance.

**Pourquoi une classe ?** Le registre est un point central. Toutes les briques sont au même endroit. Si on veut savoir ce qui est disponible : `BlockRegistry.list()`.

---

### Classe 7 : `Pipeline` — `core/pipeline.py:10`

**C'est la classe la plus importante.** Elle prend le graphe et le transforme en un vrai modèle PyTorch.

#### Constructeur — `__init__` (ligne 11)

```python
def __init__(self, graph: Graph) -> None:
    self.graph = graph           # on reçoit un Graph tout construit
    self._order: list[str] = []  # sera rempli plus tard
```

`Pipeline` reçoit un objet `Graph` qui a déjà ses `nodes` et ses `edges`. Il ne sait PAS comment le graphe a été construit (JSON ? YAML ? code ? → pas son problème). C'est **l'injection de dépendance**.

#### `build_model()` — ligne 15 (la méthode principale)

```python
def build_model(self) -> nn.Module:
```

Construit un vrai modèle PyTorch. Déroulé ligne par ligne :

```python
    self._order = self.graph.topological_sort()
```
→ **Étape 1 :** Demande au graphe l'ordre d'exécution des nœuds.
→ Résultat : `["input_1", "conv1", "relu1", "pool1", "conv2", ...]`

```python
    layers: list[nn.Module] = []
```
→ **Étape 2 :** Crée une liste vide pour les couches PyTorch.

```python
    for node_id in self._order:
        node = self.graph.nodes[node_id]
```
→ **Étape 3 :** Pour chaque nœud dans l'ordre. Exemple : `node_id = "conv1"`, on récupère l'objet `GraphNode` correspondant.

```python
        layer = self._build_node(node)
```
→ **Étape 4 :** Transforme ce nœud en vrai module PyTorch (ex: `nn.Conv2d(1, 32, 3)`).

```python
        if layer is not None:
            layers.append(layer)
```
→ **Étape 5 :** Ajoute la couche à la liste. Les nœuds `input` (sans builder) sont ignorés.

```python
    return nn.Sequential(*layers)
```
→ **Étape 6 :** Assemble tout dans un `nn.Sequential`. Le `*` dépaquette la liste.

**Résultat final :**
```
Sequential(
  (0): Conv2d(1, 32, kernel_size=3, stride=1)
  (1): ReLU()
  (2): MaxPool2d(kernel_size=2)
  ...
)
```

**Utilisation :**
```python
model = pipeline.build_model()
y = model(torch.randn(1, 1, 28, 28))  # → tensor (1, 10) ✅
```

#### `_build_node()` — ligne 24

Transforme **UN** nœud en **UN** module PyTorch :

```python
def _build_node(self, node: GraphNode) -> nn.Module | None:
    if node.block is None:
        return None                              # pas de brique → ignoré
    try:
        return node.block.build_layer(node.params) # appelle le builder
    except NotImplementedError:
        return None                              # pas de builder → ignoré
```

1. `node.block` = le `BlockMeta` de la brique (ex: `conv2d`)
2. `block.build_layer(params)` appelle la fonction builder : `_build_conv2d({"in_channels": 1, ...})`
3. La builder retourne `nn.Conv2d(1, 32, kernel_size=3, ...)`

#### Schéma récapitulatif du Pipeline

```
Pipeline(graph)
    │
    ├── graph.topological_sort()
    │   → ["input_1", "conv1", "relu1", "pool1", ...]
    │
    └── build_model()
        │
        │   pour chaque nœud dans l'ordre :
        │       │
        │       ▼
        │   _build_node(node)
        │       │
        │       ├── node.block = BlockRegistry.get("conv2d")
        │       │               → BlockMeta(conv2d, ...)
        │       │
        │       ├── node.block.build_layer(node.params)
        │       │               → _build_conv2d(params)
        │       │               → retourne nn.Conv2d(1, 32, 3)
        │       │
        │       └── retourne nn.Conv2d(1, 32, 3)
        │
        │   layers.append(nn.Conv2d(1, 32, 3))
        │   layers.append(nn.ReLU())
        │   layers.append(nn.MaxPool2d(2))
        │   ...
        │
        └── nn.Sequential(*layers)
            → modèle PyTorch prêt à être utilisé
```

**En résumé :**

| Méthode | Rôle |
|---------|------|
| `build_model()` | Parcourt le graphe dans l'ordre → assemble un `nn.Sequential` |
| `_build_node(node)` | Transforme 1 nœdu du graphe en 1 module PyTorch |

---

### 7.3 Comment les classes communiquent entre elles

```
JSON (fichier)
    │
    ▼
┌──────────────┐
│ ConfigLoader │  → `data` (dict python)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Graph     │  → `self.nodes` (dict de GraphNode)
│              │     `self.edges` (list de Edge)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Pipeline   │  → utilise `graph.nodes` et `graph.topological_sort()`
│              │
│   build_model│  → nn.Sequential (modèle PyTorch)
└──────────────┘

GraphNode, lui, utilise :
    ┌──────────────┐
    │ BlockRegistry│  → BlockMeta  → `build_layer(params)` → nn.Module
    └──────────────┘
```

**Flèches = qui utilise qui :**

- `Graph` utilise `GraphNode` + `Edge` **(composition)**
- `GraphNode` utilise `BlockRegistry` **(dépendance)**
- `Pipeline` utilise `Graph` **(dépendance injectée)**
- `BlockRegistry` stocke des `BlockMeta` **(collection)**

---

### 7.4 Résumé des concepts OOP utilisés

| Concept OOP | Où ? | Explication simple |
|-------------|------|-------------------|
| **Classe** | Partout | Un moule qui décrit un objet (ex: `GraphNode` = moule pour fabriquer des nœuds) |
| **Objet/Instance** | Partout | Un truc concret créé à partir du moule (ex: `GraphNode("conv1", ...)` = un nœud réel) |
| **Constructeur** `__init__` | Partout | La fonction qui prépare l'objet quand on le crée |
| **Attribut** `self.xxx` | Partout | Une donnée qui appartient à l'objet (ex: `self.id`, `self.params`) |
| **Méthode** `def ...(self)` | Partout | Une fonction qui agit sur l'objet (ex: `graph.topological_sort()`) |
| **Composition** | `Graph` contient `GraphNode[]` + `Edge[]` | Un objet est fait d'autres objets (comme une voiture contient des roues) |
| **Encapsulation** | `self._build_fn` (privé) | Les détails internes sont cachés (le `_` dit "ne touche pas de l'extérieur") |
| **Méthode de classe** `@classmethod` | `BlockRegistry` | Une méthode qui agit sur la classe, pas sur une instance |
| **Méthode statique** `@staticmethod` | `ConfigLoader.validate` | Une fonction utilitaire rangée dans la classe (pas besoin de `self`) |
| **Dependency Injection** | `Pipeline(graph)` | On donne les dépendances de l'extérieur au lieu de les créer à l'intérieur |
| **Registry Pattern** | `BlockRegistry` | Un endroit central où enregistrer/trouver des objets par leur nom |
| **Strategy Pattern** | `BlockMeta.build_layer` → builder function | Chaque type de brique a sa propre stratégie pour construire son module PyTorch |
| **Type Hinting** `-> nn.Module` | Partout | On dit quel type de donnée on attend/retourne (auto-documentation) |

### 7.5 Pourquoi c'est mieux qu'un gros script ?

**Sans OOP (un seul fichier de 300 lignes) :**
```
config.py
├── 50 lignes pour charger le JSON
├── 40 lignes pour valider
├── 60 lignes pour les nœuds
├── 60 lignes pour le graphe
├── 50 lignes pour le tri
├── 40 lignes pour construire le modèle

└── 50 lignes pour les briques
```
→ Tu changes une ligne, tu casses tout. 👎

**Avec OOP (fichiers séparés) :**
```
config.py      → 30 lignes (charge le JSON)
graph.py       → 88 lignes (graphe)
block.py       → 64 lignes (registre)
pipeline.py    → 88 lignes (construction)
cnn.py         → 205 lignes (briques)
```
→ Chaque fichier est indépendant. Tu peux changer `config.py` sans toucher au reste. 👍

---

## 8. Comment tester le projet

### Lancer tous les tests

```bash
cd MLBlock
source .venv/bin/activate
python3 -m pytest tests/ -v
```

Ce qui est testé (33 tests) :

| Fichier | Ce qui est testé |
|---------|-----------------|
| `tests/test_block.py` | Enregistrement, recherche, builders de chaque brique |
| `tests/test_config.py` | Chargement JSON, validation (données manquantes, mauvais format) |
| `tests/test_graph.py` | Nœuds, arêtes, tri topologique, détection de cycles, validation |
| `tests/test_pipeline.py` | Construction du modèle, forward pass, forme des sorties, tous les types de briques |

### Lancer un fichier spécifique

```bash
python3 -m pytest tests/test_pipeline.py -v
```

### Lancer un test spécifique

```bash
python3 -m pytest tests/test_graph.py::test_cyclic_graph -v
```

### Lancer le script de démo

```bash
python3 demo.py
```

### Ajouter un test

Crée un fichier `tests/test_xxx.py` avec des fonctions `def test_xxx():`. Pytest les trouvera automatiquement.

---

## 9. Résumé

1. **Tu écris un JSON** qui décrit ton réseau (quelles briques et comment les connecter)
2. **MLBlocks lit le JSON**, vérifie que tout est correct, et construit le vrai modèle PyTorch
3. **Tu obtiens un modèle qui marche** : `model = build_cnn_from_config("config.json")` → prêt à entraîner

**Le but :** rendre la création de réseaux de neurones aussi simple que de jouer aux Lego.
