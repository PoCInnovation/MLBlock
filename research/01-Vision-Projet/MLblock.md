# MLblock — Scratch de l'Intelligence Artificielle

> **Vision :** Une interface visuelle par blocs (façon Scratch) pour construire des pipelines d'IA.
> Chaque bloc est une **poupée russe** : il peut être "ouvert" pour révéler ses sous-blocs.
> Plus l'utilisateur fore vers le bas, plus il personnalise.
> Le backend est du PyTorch / scikit-learn réel — pas de boîte magique.

---

## 1. Concept & Philosophie

### 1.1 Le problème

Construire un modèle d'IA aujourd'hui demande :
- Connaître des frameworks (PyTorch, scikit-learn)
- Écrire du code boilerplate (chargement, normalisation, entraînement, évaluation)
- Comprendre des concepts mathématiques (gradients, loss, backprop)

**MLblock abstrait tout ça en blocs visuels emboîtables**, où chaque niveau de profondeur correspond à un niveau de contrôle plus fin.

### 1.2 Le principe : Forage vertical (drill-down)

Au lieu d'avoir 3 niveaux "plats" qu'on sélectionne dans un menu, l'utilisateur **fore** dans les blocs :

```
Niveau 0 ──── [       Modèle      ]   ← Un seul bloc, je choisis juste "Classification"
                  ▼  ouvre
Niveau 1 ──── [   Algorithme   ]       ← Je choisis "Random Forest"
                  ▼  ouvre
Niveau 2 ──── [Hyperparamètres]        ← Je règle n_estimators=100, max_depth=10
                  ▼  ouvre
Niveau 3 ──── [    Code ML     ]       ← Je vois/édite le vrai code sklearn
                  ▼  ouvre
Niveau 4 ──── [  Code PyTorch  ]       ← Je réécris tout en pur PyTorch
```

Chaque bloc est un **conteneur** qui peut être "ouvert" (expand) pour révéler son intérieur. L'intérieur est fait de sous-blocs, qui sont eux-mêmes ouvrables, etc.

### 1.3 Les niveaux de forage

| Profondeur | Nom | Public | Ce qu'il voit |
|------------|-----|--------|---------------|
| **L0** | Bloc Boîte Noire | Débutant total | Un seul bloc "Classification". Il clique "Entraîner", ça marche. |
| **L1** | Bloc Composite | Curieux | Le même bloc ouvert : dedans il y a `[Dataset] → [Modèle] → [Entraînement]`. |
| **L2** | Bloc Paramétrable | Data Scientist | Les sous-blocs s'ouvrent : `[RandomForest]` avec `n_estimators`, `max_depth`. |
| **L3** | Bloc Code | Ingénieur ML | Le code sklearn/PyTorch est visible et éditable dans le bloc. |
| **L4** | Bloc Atomique | Chercheur | Chaque opération est un bloc : `Linear`, `ReLU`, `CrossEntropyLoss`, boucle `for`. |

### 1.4 Principe de conception : "Révéler, pas cacher"

Une boîte noire frustre l'utilisateur qui veut comprendre. MLblock inverse le paradigme :

> **Chaque bloc est une promesse : "Ouvre-moi pour voir comment je fonctionne vraiment."**

- L'utilisateur commence toujours au niveau qu'il comprend
- Il fore quand il a confiance, jamais par obligation
- Le niveau le plus bas est **toujours** le vrai code PyTorch/sklearn — pas une abstraction

---

## 2. Architecture du système de blocs

### 2.1 Anatomie d'un bloc

Chaque bloc est un objet sérialisable (JSON) avec référence à ses enfants :

```json
{
  "id": "uuid_unique",
  "opcode": "model_classifier",
  "namespace": "sklearn",
  "shape": "command",
  "category": "models",
  "depth": 0,
  "children": {
    "algorithm": { "type": "block", "value": null },
    "training":  { "type": "block", "value": null }
  },
  "fields": {
    "NAME": { "name": "nom_modele", "value": "Mon Classifieur" }
  },
  "expanded": false,
  "next": null,
  "parent": null
}
```

### 2.2 Types de blocs (shapes)

| Shape | Rôle | Exemple |
|-------|------|---------|
| **Container** 📦 | Bloc qui contient d'autres blocs (ouvrable) | `Modèle`, `Pipeline`, `Entraînement` |
| **Hat** 🎩 | Déclencheur (event), toujours au sommet | "Quand dataset chargé", "Début" |
| **Command** 🔲 | Action simple | "Charger CSV", "Sauvegarder poids" |
| **Reporter** 🔵 | Valeur / expression | "Accuracy", "Moyenne tenseur" |
| **C-Block** 🔄 | Contrôle / boucle | "Répéter N epochs", "Pour chaque batch" |
| **Mutator** ✏️ | Entrées dynamiques (+/-) | "Couches du réseau", "Hyperparamètres" |
| **Leaf** 🍃 | Bloc atomique (non ouvrable) | `nn.Linear`, `ReLU`, `CrossEntropyLoss` |

### 2.3 Catégories de blocs

| Catégorie | Couleur | Blocs L0 (fermés) | Blocs L2 (ouverts) |
|-----------|---------|--------------------|--------------------|
| **Data** | Bleu | `Charger Dataset` | `CSV` → `Split` → `Normaliser` |
| **Models** | Vert | `Modèle` | `Algo` → `Hyperparams` → `Couches` |
| **Training** | Rouge | `Entraînement` | `Loss` → `Optimizer` → `Boucle` → `Epochs` |
| **Evaluation** | Violet | `Évaluation` | `Métrique` → `Graphique` → `Rapport` |
| **Tensors** | Orange | `Réseau` | `Conv2d` → `Linear` → `ReLU` → `Dropout` |
| **Control** | Gris | `Pipeline` | `Pour chaque` → `Si` → `Attendre` |
| **Variables** | Jaune | `Variable` | `DatasetRef` → `ModelRef` → `Scalaire` |

### 2.4 Blocs conteneurs (Container) — la clé du forage

Un **ContainerBlock** est un bloc qui possède un dictionnaire `children`. Chaque enfant est soit :
- Un sous-bloc direct (`type: "block"`)
- Un slot pour valeur (`type: "variable"`, `type: "number"`, etc.)

Quand l'utilisateur **ouvre** (expand) un container :

```
 Avant ouverture (L0) :
┌──────────────────────────────┐
│  [ Modèle ]   ▲              │
│  ─────────────────────────   │
│  Type : Classifieur ▼        │
│  Dataset : [iris.csv]        │
└──────────────────────────────┘

 Après ouverture (L1) :
┌──────────────────────────────┐
│  [ Modèle ]   ▼              │  ← même bloc, mais expanded=true
│  ─────────────────────────   │
│  ├─ [ Algorithme ]           │  ← sous-bloc Container
│  ├─ [ Entraînement ]         │  ← sous-bloc Container
│  └─ [ Évaluation ]           │  ← sous-bloc Container
└──────────────────────────────┘

 Après ouverture de [Algorithme] (L2) :
┌──────────────────────────────┐
│  [ Modèle ]   ▼              │
│  ─────────────────────────   │
│  ├─ [ Algorithme ]   ▼       │
│  │  ─────────────────────    │
│  │  ├─ RandomForest          │  ← choix de l'algo
│  │  ├─ n_estimators: [100]   │  ← champ paramétrable
│  │  └─ max_depth: [10]       │  ← champ paramétrable
│  ├─ [ Entraînement ]         │
│  └─ [ Évaluation ]           │
└──────────────────────────────┘
```

### 2.5 Hiérarchie complète d'un projet typique

```
Projet "Prédiction Iris"
│
├─ [Dataset: iris.csv]  ← Container
│   ├─ [Source: Fichier CSV]
│   ├─ [Colonnes: X=4, y=1]
│   └─ [Split: 80/20]  ← Container
│       ├─ test_size: 0.2
│       └─ stratify: true
│
├─ [Modèle: Classifieur]  ← Container (L0 → L4)
│   ├─ [Algorithme]  ← Container
│   │   ├─ Type: RandomForest ▼  ← dropdown
│   │   ├─ n_estimators: 100     ← field
│   │   ├─ max_depth: 10         ← field
│   │   ├─ min_samples_split: 2  ← field
│   │   └─ [Code]  ← Leaf (L3)
│   │       └─ from sklearn.ensemble import RandomForestClassifier
│   │          model = RandomForestClassifier(n_estimators=100, ...)
│   │
│   ├─ [Entraînement]  ← Container
│   │   ├─ [Loss: CrossEntropy]  ← Leaf
│   │   ├─ [Optimizer: Adam]     ← Leaf
│   │   │   └─ lr: 0.001
│   │   ├─ [Boucle: N epochs]    ← C-Block
│   │   │   └─ n_epochs: 10
│   │   └─ [Code]  ← Leaf (L3)
│   │       └─ for epoch in range(10):
│   │              loss = criterion(model(X_batch), y_batch)
│   │              loss.backward()
│   │              optimizer.step()
│   │
│   └─ [Évaluation]  ← Container
│       ├─ [Métrique: Accuracy]
│       └─ [Graphique: Matrice confusion]
│
└─ [Résultat]  ← Reporter
    └─ accuracy: 0.97
```

---

## 3. Backend — PyTorch & scikit-learn comme moteurs

### 3.1 Principe : chaque bloc contient du vrai code

Le principe fondamental : **au niveau le plus profond (L3/L4), il n'y a plus d'abstraction.**

```
 Bloc L0 ──→ "Classification"
 Bloc L1 ──→ "Utiliser un Random Forest"
 Bloc L2 ──→ RandomForestClassifier(n_estimators=100, max_depth=10)
 Bloc L3 ──→ Le code sklearn ci-dessus est visible dans le bloc
 Bloc L4 ──→ Implémentation manuelle en PyTorch, boucle d'entraînement comprise
```

### 3.2 Exemple de forage complet

#### L0 : Je pose un seul bloc

```
┌──────────────────────────────────────────┐
│  [ Classification ]                      │
│  Dataset: iris.csv                       │
│  Cibler: species                         │
└──────────────────────────────────────────┘
```

Ce bloc unique appelle en interne :

```python
# Automatique, l'utilisateur ne voit rien
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd

df = pd.read_csv("iris.csv")
X, y = df.drop("species", axis=1), df["species"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier()
model.fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
```

#### L1 : J'ouvre le bloc, je vois l'orchestration

```
┌──────────────────────────────────────────┐
│  [ Classification ]  ▼                   │
│  ──────────────────────────────────────  │
│  ├─ [ Charger: iris.csv ]                │
│  ├─ [ Split: 80/20 ]                     │
│  ├─ [ Modèle ]                           │  ← Container, ouvrable
│  └─ [ Résultat: Accuracy ]               │
└──────────────────────────────────────────┘
```

#### L2 : J'ouvre [Modèle], je paramètre

```
┌──────────────────────────────────────────┐
│  [ Classification ]  ▼                   │
│  ├─ [ Split: 80/20 ]                     │
│  ├─ [ Modèle ]  ▼                        │
│  │  ├─ Algorithme: RandomForest ▼        │
│  │  ├─ n_estimators: [ 100 ]             │
│  │  └─ max_depth: [ 10 ]                 │
│  └─ [ Résultat: Accuracy ]               │
└──────────────────────────────────────────┘
```

Le code interne devient :

```python
model = RandomForestClassifier(n_estimators=100, max_depth=10)
```

#### L3 : J'ouvre le code dans le bloc

Le bloc affiche maintenant le code généré, et je peux l'éditer **directement dans le bloc** :

```
┌──────────────────────────────────────────┐
│  [ Modèle ]  ▼  (Code visible)           │
│  ──────────────────────────────────────  │
│  │ from sklearn.ensemble import          │
│  │     RandomForestClassifier            │
│  │ model = RandomForestClassifier(       │
│  │     n_estimators=100,                 │
│  │     max_depth=10,                     │
│  │     random_state=42                   │
│  │ )                                     │
│  └────────────────────────────────────── │
└──────────────────────────────────────────┘
```

#### L4 : Je bascule en pur PyTorch

Le même bloc peut passer en mode PyTorch. Les champs se réorganisent :

```
┌──────────────────────────────────────────┐
│  [ Modèle PyTorch ]  ▼                   │
│  ├─ [ Architecture ]                     │
│  │  ├─ Couche 1: Linear(4 → 64)          │
│  │  ├─ Activation: ReLU                  │
│  │  └─ Couche 2: Linear(64 → 3)          │
│  ├─ [ Entraînement ]                     │
│  │  ├─ Loss: CrossEntropyLoss            │
│  │  ├─ Optimizer: Adam(lr=0.001)         │
│  │  └─ Epochs: 100                       │
│  └─ [ Code ]                             │
│     │ class IrisNet(nn.Module):          │
│     │     def __init__(self):            │
│     │         self.fc1 = nn.Linear(4,64) │
│     │         self.fc2 = nn.Linear(64,3) │
│     │     def forward(self, x):          │
│     │         x = F.relu(self.fc1(x))    │
│     │         return self.fc2(x)         │
│     └─────────────────────────────────── │
└──────────────────────────────────────────┘
```

### 3.3 Architecture d'exécution

```
┌───────────────────────────────────────────────┐
│               Workspace UI                     │
│  (Blocs visuels, glisser-déposer, expand)      │
└──────────────────┬────────────────────────────┘
                   │ sérialise / désérialise
                   ▼
┌───────────────────────────────────────────────┐
│         Block AST (Arbre de conteneurs)         │
│  Container → children → Container → children    │
│  Chaque niveau de profondeur = forage            │
└──────────────────┬────────────────────────────┘
                   │ interprète (depth = niveau de l'user)
                   ▼
┌───────────────────────────────────────────────┐
│            Runtime Engine (VM)                  │
│  Parcourt l'arbre en fonction du niveau actif   │
│  Si depth=0 → utilise les handlers L0          │
│  Si depth=N → descend dans children, résout    │
└──────┬──────────────────────┬─────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│ sklearn-lite │    │  pytorch-engine   │
│ fit/predict  │    │  autograd/train   │
│ transform    │    │  forward/backward │
└──────────────┘    └──────────────────┘
```

### 3.4 Runtime Engine — résolution récursive des conteneurs

```python
class RuntimeEngine:
    def __init__(self, user_depth: int):
        self.user_depth = user_depth  # jusqu'où l'utilisateur a foré

    def execute(self, block, context):
        """Exécute un bloc à la profondeur demandée."""

        # Si le bloc a des enfants ET que l'utilisateur a foré assez profond
        if isinstance(block, ContainerBlock) and self.user_depth > block.depth:
            # Exécuter chaque enfant récursivement (orchestration)
            for child in block.children.values():
                self.execute(child, context)
            return

        # Si on est à un niveau feuille ou que l'utilisateur s'arrête ici
        handler = self.get_handler(block.opcode, self.user_depth)
        resolved = self._resolve_inputs(block, context)
        result = handler(**resolved, fields=block.fields)

        if block.variable_output:
            context.variables[block.variable_output] = result

        # Passer au suivant
        if block.next:
            self.execute(block.next, context)

    def _resolve_inputs(self, block, context):
        resolved = {}
        for key, inp in block.inputs.items():
            if inp["type"] == "block" and inp["value"] is not None:
                # L'entrée est un bloc reporter → l'exécuter
                resolved[key] = self.execute(inp["value"], context)
            elif inp["type"] == "variable":
                resolved[key] = context.variables.get(inp["value"])
            elif inp["type"] == "child_ref":
                # Référence à un sous-bloc du container parent
                resolved[key] = self.execute(
                    block.parent.children[inp["value"]], context
                )
            else:
                resolved[key] = inp["value"]
        return resolved
```

### 3.5 Handlers multi-profondeur

Un même `opcode` peut avoir plusieurs handlers selon la profondeur :

```python
class SklearnHandlers:
    @staticmethod
    def model_handler_L0(**kwargs):
        """Handler L0 : boîte noire, tout est automatique."""
        from sklearn.ensemble import RandomForestClassifier
        model = RandomForestClassifier()
        model.fit(kwargs["X_train"], kwargs["y_train"])
        return model

    @staticmethod
    def model_handler_L2(algo="RandomForest", n_estimators=100, max_depth=None, **kwargs):
        """Handler L2 : l'utilisateur a choisi l'algo et réglé les hyperparams."""
        if algo == "RandomForest":
            from sklearn.ensemble import RandomForestClassifier
            return RandomForestClassifier(
                n_estimators=n_estimators,
                max_depth=max_depth
            ).fit(kwargs["X_train"], kwargs["y_train"])
        elif algo == "SVM":
            from sklearn.svm import SVC
            return SVC().fit(kwargs["X_train"], kwargs["y_train"])

    @staticmethod
    def model_handler_L4(architecture: list, **kwargs):
        """Handler L4 : l'utilisateur a construit son propre réseau PyTorch."""
        import torch.nn as nn
        layers = []
        for layer_def in architecture:
            if layer_def["type"] == "linear":
                layers.append(nn.Linear(layer_def["in"], layer_def["out"]))
            elif layer_def["type"] == "relu":
                layers.append(nn.ReLU())
        model = nn.Sequential(*layers)
        # ... boucle d'entraînement complète
        return model
```

---

## 4. Modèle Objet

```python
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Union
from enum import Enum

# ─── Enums ─────────────────────────────────────────────────

class BlockShape(Enum):
    CONTAINER = "container"
    HAT       = "hat"
    COMMAND   = "command"
    REPORTER  = "reporter"
    C_BLOCK   = "c_block"
    MUTATOR   = "mutator"
    LEAF      = "leaf"

class BlockCategory(Enum):
    DATA     = "data"
    MODELS   = "models"
    TRAINING = "training"
    EVAL     = "evaluation"
    TENSORS  = "tensors"
    CONTROL  = "control"
    VARIABLE = "variable"

# ─── Classe de base ────────────────────────────────────────

class Block(ABC):
    """Classe mère. Tout bloc est soit feuille, soit conteneur."""

    def __init__(self, id: str, opcode: str, namespace: str,
                 shape: BlockShape, category: BlockCategory,
                 depth: int = 0):
        self.id = id
        self.opcode = opcode
        self.namespace = namespace          # "sklearn" | "pytorch" | "control"
        self.shape = shape
        self.category = category
        self.depth: int = depth             # Niveau de profondeur (0=boîte noire)
        self.expanded: bool = False         # ouvert/fermé dans l'UI
        self.next: Optional[Block] = None
        self.parent: Optional[Block] = None
        self.fields: Dict[str, Any] = {}
        self.inputs: Dict[str, InputSlot] = {}
        self.variable_output: Optional[str] = None
        self.mutator: Optional[Mutator] = None

    @abstractmethod
    def validate(self) -> bool:
        pass

    @abstractmethod
    def to_code(self, depth: int) -> str:
        pass

    def to_json(self) -> dict:
        return {
            "id": self.id,
            "opcode": self.opcode,
            "namespace": self.namespace,
            "shape": self.shape.value,
            "category": self.category.value,
            "depth": self.depth,
            "expanded": self.expanded,
            "inputs": {k: v.to_dict() for k, v in self.inputs.items()},
            "fields": self.fields,
            "next": self.next.id if self.next else None,
            "parent": self.parent.id if self.parent else None,
        }

# ─── Container — la clé du forage ─────────────────────────

class ContainerBlock(Block):
    """
    Bloc qui contient d'autres blocs.
    Il représente un niveau d'abstraction.
    Quand l'utilisateur l'ouvre (expanded=True), les enfants deviennent visibles.
    """

    def __init__(self, **kwargs):
        # Par défaut un Container a shape=CONTAINER
        if "shape" not in kwargs:
            kwargs["shape"] = BlockShape.CONTAINER
        super().__init__(**kwargs)
        self.children: Dict[str, Block] = {}    # Sous-blocs (clé = nom logique)
        self.children_order: List[str] = []      # Ordre d'affichage des enfants

    def add_child(self, name: str, block: Block):
        """Ajoute un sous-bloc."""
        self.children[name] = block
        block.parent = self
        block.depth = self.depth + 1
        if name not in self.children_order:
            self.children_order.append(name)

    def remove_child(self, name: str):
        if name in self.children:
            del self.children[name]
            self.children_order.remove(name)

    def open(self):
        """Ouvre le container (UI : révèle les enfants)."""
        self.expanded = True

    def close(self):
        """Ferme le container (UI : cache les enfants)."""
        self.expanded = False

    def get_code_at_depth(self, target_depth: int) -> str:
        """
        Génère le code pour le niveau de profondeur demandé.
        Si target_depth > self.depth, descend dans les enfants.
        Si target_depth == self.depth, c'est un résumé.
        """
        if target_depth <= self.depth:
            return self._summary_code()
        else:
            lines = []
            for name in self.children_order:
                child = self.children[name]
                if isinstance(child, ContainerBlock):
                    lines.append(child.get_code_at_depth(target_depth))
                else:
                    lines.append(child.to_code(target_depth))
            return "\n".join(lines)

    def _summary_code(self):
        return f"# {self.opcode} (niveau {self.depth})"

    def validate(self):
        return len(self.children) > 0

# ─── Blocs feuilles (atomes) ──────────────────────────────

class LeafBlock(Block):
    """Bloc atomique : une opération simple, non ouvrable."""

    def __init__(self, **kwargs):
        kwargs.setdefault("shape", BlockShape.LEAF)
        super().__init__(**kwargs)

    def validate(self):
        return True

    def to_code(self, depth: int):
        if self.namespace == "sklearn":
            return self._sklearn_code(depth)
        elif self.namespace == "pytorch":
            return self._pytorch_code(depth)
        return f"# Leaf: {self.opcode}"

    def _sklearn_code(self, depth):
        params = ", ".join(f"{k}={v}" for k, v in self.fields.items())
        return f"{self.opcode}({params})"

    def _pytorch_code(self, depth):
        if depth >= 3:
            # L'utilisateur voit le vrai code
            return self.fields.get("code", f"nn.{self.opcode}(**fields)")
        else:
            params = ", ".join(f"{k}={v}" for k, v in self.fields.items())
            return f"nn.{self.opcode}({params})"

# ─── Spécialisations ──────────────────────────────────────

class HatBlock(Block):
    """Déclencheur (toujours au sommet d'un script)."""
    def __init__(self, event_type: str, **kwargs):
        kwargs.setdefault("shape", BlockShape.HAT)
        super().__init__(**kwargs)
        self.event_type = event_type

    def validate(self):
        return bool(self.event_type)

    def to_code(self, depth):
        return f"# Quand: {self.event_type}"

class CBlock(ContainerBlock):
    """Bloc de contrôle : boucle, condition. Contient un substack."""

    def __init__(self, **kwargs):
        kwargs.setdefault("shape", BlockShape.C_BLOCK)
        super().__init__(**kwargs)
        self.substack: List[Block] = []       # Corps de la boucle/condition
        self.substack_else: List[Block] = []  # Branche else (optionnel)

    def add_to_body(self, block: Block):
        self.substack.append(block)
        block.parent = self

# ─── Mutateur (entrées dynamiques) ────────────────────────

class Mutator:
    """Permet d'ajouter/enlever des entrées sur un bloc dynamiquement."""

    def __init__(self, parent: Block):
        self.parent = parent
        self.input_slots: List[str] = []

    def add_input(self, name: str, type: str):
        self.input_slots.append(name)
        self.parent.inputs[name] = InputSlot(name, type)

    def remove_input(self, name: str):
        if name in self.input_slots:
            self.input_slots.remove(name)
            del self.parent.inputs[name]

# ─── Slots ─────────────────────────────────────────────────

class InputSlot:
    """Connecteur d'entrée sur un bloc."""

    def __init__(self, name: str, type: str, value=None):
        self.name = name
        self.type = type    # "block", "variable", "number", "string", "child_ref"
        self.value = value

    def to_dict(self):
        return {"name": self.name, "type": self.type, "value": self.value}

# ─── Moteur d'exécution ───────────────────────────────────

class ExecutionContext:
    """Contexte partagé pendant l'exécution du pipeline."""
    def __init__(self):
        self.variables = {}
        self.history = []
        self.current_epoch = 0
        self.best_loss = float("inf")

class HandlerRegistry:
    """Registre des handlers avec résolution par profondeur."""

    def __init__(self):
        self._handlers = {}   # clé: (opcode, depth) → handler

    def register(self, opcode: str, handler_fn: callable, depth: int = 0):
        self._handlers[(opcode, depth)] = handler_fn

    def get(self, opcode: str, depth: int = 0):
        """Trouve le handler le plus adapté à la profondeur demandée."""
        # Cherche exactement cette profondeur, puis remonte vers le haut
        for d in range(depth, -1, -1):
            handler = self._handlers.get((opcode, d))
            if handler:
                return handler
        return None

class RuntimeEngine:
    """Parcourt l'arbre de blocs et exécute les handlers."""

    def __init__(self, registry: HandlerRegistry, user_depth: int = 0):
        self.registry = registry
        self.user_depth = user_depth

    def execute(self, block: Block, context: ExecutionContext):
        """Exécute récursivement un bloc à la profondeur courante."""

        # Container : si user a foré assez profond, exécuter les enfants
        if isinstance(block, ContainerBlock) and self.user_depth > block.depth:
            for child_name in block.children_order:
                child = block.children[child_name]
                self.execute(child, context)
            return

        # C-Block : exécuter le substack
        if isinstance(block, CBlock) and self.user_depth > block.depth:
            for _ in range(block.fields.get("n_epochs", 1)):
                for subblock in block.substack:
                    self.execute(subblock, context)
            return

        # Bloc normal : résoudre les entrées, appeler le handler
        handler = self.registry.get(block.opcode, self.user_depth)
        if handler is None:
            raise RuntimeError(f"Pas de handler pour {block.opcode} à depth={self.user_depth}")

        resolved = self._resolve_inputs(block, context)
        result = handler(**resolved, fields=block.fields)

        if block.variable_output:
            context.variables[block.variable_output] = result

        if block.next:
            self.execute(block.next, context)

    def _resolve_inputs(self, block, context):
        resolved = {}
        for key, inp in block.inputs.items():
            if inp["type"] == "block" and inp["value"] is not None:
                resolved[key] = self.execute(inp["value"], context)
            elif inp["type"] == "variable":
                resolved[key] = context.variables.get(inp["value"])
            elif inp["type"] == "child_ref" and isinstance(block.parent, ContainerBlock):
                child_block = block.parent.children.get(inp["value"])
                if child_block:
                    resolved[key] = self.execute(child_block, context)
            else:
                resolved[key] = inp["value"]
        return resolved

# ─── Workspace — le projet complet ────────────────────────

class Workspace:
    """Le projet : arbre de blocs, variables, datasets."""

    def __init__(self):
        self.scripts: List[Block] = []           # Les scripts racines
        self.variables: Dict[str, Any] = {}
        self.datasets: Dict[str, Any] = {}
        self.user_depth: int = 0                  # Profondeur courante de l'utilisateur
        self.registry: HandlerRegistry = HandlerRegistry()

    def add_script(self, hat: HatBlock):
        self.scripts.append(hat)

    def set_depth(self, depth: int):
        self.user_depth = depth

    def run(self):
        engine = RuntimeEngine(self.registry, self.user_depth)
        context = ExecutionContext()
        context.variables.update(self.variables)
        for script in self.scripts:
            engine.execute(script, context)

    def export_code(self, depth: Optional[int] = None) -> str:
        """Génère un script Python depuis les blocs à la profondeur donnée."""
        d = depth if depth is not None else self.user_depth
        lines = [
            "# Généré par MLblock",
            "# Profondeur de forage : %d" % d,
            "",
            "import numpy as np",
            "import torch" if d >= 3 else "from sklearn.pipeline import make_pipeline",
            "",
        ]
        for script in self.scripts:
            if isinstance(script, ContainerBlock):
                lines.append(script.get_code_at_depth(d))
            else:
                lines.append(script.to_code(d))
        return "\n".join(lines)

    def get_flat_blocks_at_depth(self, depth: int) -> List[Block]:
        """Retourne tous les blocs visibles à une profondeur donnée (pour l'UI)."""
        visible = []
        for script in self.scripts:
            self._collect_visible(script, depth, visible)
        return visible

    def _collect_visible(self, block: Block, depth: int, result: List[Block]):
        if isinstance(block, ContainerBlock):
            if depth > block.depth:
                # Afficher les enfants
                for child in block.children.values():
                    self._collect_visible(child, depth, result)
            else:
                # Afficher le container, pas les enfants
                result.append(block)
        else:
            result.append(block)
```

---

## 5. Exemple complet : forage progressif

### L0 — Un débutant pose 3 blocs

```
┌───────────────────────┐
│ [ Dataset: iris.csv ] │
├───────────────────────┤
│ [ Classification ]    │
├───────────────────────┤
│ [ Accuracy: 0.97 ]    │
└───────────────────────┘
```

**Code généré (invisible) :**
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import pandas as pd

df = pd.read_csv("iris.csv")
X, y = df.drop("species", axis=1), df["species"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = RandomForestClassifier()
model.fit(X_train, y_train)
accuracy = model.score(X_test, y_test)
```

### L1 — L'utilisateur fore, voit l'orchestration

```
┌───────────────────────────────────┐
│ [ Dataset ]  ▼                    │
│ ├─ Source: iris.csv               │
│ ├─ X: 4 colonnes                  │
│ └─ y: species                     │
├───────────────────────────────────┤
│ [ Classification ]  ▼             │
│ ├─ [ Split: 80/20 ]               │
│ ├─ [ Algorithme ]                 │  ← encore fermé
│ ├─ [ Entraînement ]               │  ← encore fermé
│ └─ [ Évaluation: Accuracy ]       │
├───────────────────────────────────┤
│ [ Résultat: 0.97 ]                │
└───────────────────────────────────┘
```

### L2 — Il ouvre [Algorithme] et paramètre

```
┌───────────────────────────────────┐
│ [ Algorithme ]  ▼                 │
│ ├─ Type: RandomForest        ▼    │
│ ├─ n_estimators: [ 100 ]          │
│ ├─ max_depth:   [ 10 ]            │
│ ├─ min_samples_split: [ 2 ]       │
│ └─ [ Voir le code ▸ ]             │  ← bouton pour passer en L3
└───────────────────────────────────┘
```

**Code généré (visible dans un panneau latéral) :**
```python
from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=2,
    random_state=42
)
model.fit(X_train, y_train)
```

### L3 — Il clique "Voir le code", le bloc devient éditeur

```
┌───────────────────────────────────┐
│ [ Algorithme ]  ▼  Code visible   │
│ ┌───────────────────────────────┐ │
│ │ from sklearn.ensemble import  │ │
│ │     RandomForestClassifier    │ │
│ │ model = RandomForestClassifier│ │
│ │     n_estimators=100,         │ │
│ │     max_depth=10,             │ │
│ │     min_samples_split=2       │ │
│ │ )                             │ │
│ └───────────────────────────────┘ │
│ [ Basculer en PyTorch ▸ ]        │
└───────────────────────────────────┘
```

### L4 — Bascule en PyTorch, architecture libre

```
┌───────────────────────────────────┐
│ [ Réseau PyTorch ]  ▼             │
│ ├─ Couches :                      │
│ │  ├─ Linear(4 → 64)     [×]      │
│ │  ├─ ReLU()              [×]      │
│ │  ├─ Linear(64 → 32)    [×]      │
│ │  ├─ ReLU()              [×]      │
│ │  └─ Linear(32 → 3)     [×]      │
│ │  [ + Ajouter une couche ]       │
│ ├─ Loss: CrossEntropyLoss         │
│ ├─ Optimizer: Adam(lr=0.001)      │
│ └─ Epochs: [ 100 ]                │
├───────────────────────────────────┤
│ [ Code généré ]                   │
│ class Net(nn.Module):             │
│     def __init__(self):           │
│         self.fc1 = nn.Linear(4,64)│
│         self.fc2 = nn.Linear(64,32│
│         self.fc3 = nn.Linear(32,3)│
│     def forward(self, x):         │
│         x = F.relu(self.fc1(x))   │
│         x = F.relu(self.fc2(x))   │
│         return self.fc3(x)        │
└───────────────────────────────────┘
```

---

## 6. L'API publique : un arbre, une profondeur

Le système se résume à deux concepts :

```python
# 1. Un arbre de blocs
workspace = Workspace()

dataset = ContainerBlock(opcode="load_csv", category=BlockCategory.DATA, depth=0)
model   = ContainerBlock(opcode="train_model", category=BlockCategory.MODELS, depth=0)
eval_   = LeafBlock(opcode="accuracy", category=BlockCategory.EVAL, depth=0)

# 2. On emboîte les blocs (les enfants sont au niveau de détail suivant)
algo = ContainerBlock(opcode="choose_algo", depth=1)
algo.add_child("type", LeafBlock(opcode="RandomForest", depth=2))
algo.add_child("n_estimators", LeafBlock(opcode="n_estimators", depth=2))
algo.children["n_estimators"].fields["value"] = 100

model.add_child("split", LeafBlock(opcode="train_test_split", depth=1))
model.add_child("algorithm", algo)
model.add_child("training", ContainerBlock(opcode="training_loop", depth=1))

workspace.add_script(HatBlock(event_type="on_start"))
workspace.scripts[0].next = dataset
dataset.next = model
model.next = eval_

# 3. L'utilisateur règle sa profondeur et exécute
workspace.set_depth(0)
workspace.run()           # L0 : boîte noire, handlers simplifiés

workspace.set_depth(2)
workspace.run()           # L2 : descend dans les enfants, paramètres visibles

print(workspace.export_code(depth=3))  # L3 : code Python complet
```

---

## 7. Roadmap technique

### Phase 1 — Noyau & Arbre
- [ ] Classes `Block`, `ContainerBlock`, `LeafBlock`, `CBlock`
- [ ] Arbre de blocs : `children`, `parent`, `next`
- [ ] Sérialisation JSON complète (avec les enfants)
- [ ] `HandlerRegistry` avec résolution par profondeur
- [ ] `RuntimeEngine` : exécution récursive depth-aware

### Phase 2 — Forage UI
- [ ] Rendu d'un Container : afficher/masquer les enfants (expand/collapse)
- [ ] Navigation verticale : clic sur un bloc pour "descendre"
- [ ] Bouton "+" pour ajouter des sous-blocs dynamiques (mutateur)
- [ ] Panneau latéral : code généré en direct

### Phase 3 — Handlers sklearn
- [ ] Handlers L0 : `RandomForestClassifier` auto, `train_test_split` auto
- [ ] Handlers L1 : orchestration (dataset → split → algo → eval)
- [ ] Handlers L2 : tous les hyperparamètres exposés
- [ ] Handlers L3 : code éditable dans le bloc

### Phase 4 — Handlers PyTorch
- [ ] `nn.Linear`, `nn.Conv2d`, `nn.ReLU`, `nn.Dropout`, `nn.Sequential`
- [ ] `CrossEntropyLoss`, `MSELoss`
- [ ] `Adam`, `SGD`
- [ ] Boucle d'entraînement en bloc C-Block
- [ ] Bascule sklearn → PyTorch sur un même bloc conteneur

### Phase 5 — Production
- [ ] Sauvegarde/chargement (.mlblock)
- [ ] Détection GPU automatique
- [ ] Exécution pas-à-pas (débug visuel)
- [ ] Export notebook Jupyter
- [ ] Système d'extensions (blocs communautaires)

---

## 8. Règles de conception (principes fondateurs)

1. **Révéler, ne pas cacher** — Tout bloc s'ouvre pour montrer son fonctionnement.
2. **Forer, pas filtrer** — On descend dans l'arbre, on ne change pas un slider "niveau".
3. **Le code est la vérité** — Au fond du forage, il n'y a plus d'abstraction, juste du PyTorch/sklearn.
4. **Chaque niveau est complet** — L'utilisateur peut s'arrêter à n'importe quelle profondeur et avoir un pipeline fonctionnel.
5. **Héritage de profondeur** — Un enfant a toujours `depth = parent.depth + 1`.
6. **Pas de saut de niveau** — On ne passe pas de L0 à L3 sans voir L1 et L2.
7. **Un bloc, un handler par profondeur** — Handler L0 = simplifié, Handler L3 = complet.

---

## 9. Références & inspirations

| Source | Concept utilisé |
|--------|-----------------|
| **Scratch (MIT)** | Blocs Hat/Command/Reporter/C, AST, VM runtime, sérialisation JSON |
| **Snap! (Berkeley)** | Blocs custom, OOP par prototypes, lambdas, continue |
| **Blockly (Google)** | Mutateurs +/- , design de blocs haut niveau, catégories |
| **PyTorch** | `nn.Module` comme brique composable, autograd, `nn.Parameter` |
| **scikit-learn** | API Estimator `fit`/`predict`/`transform`, `Pipeline`, `make_pipeline` |
| **LEGO EV3** | Patterns séquentiel/parallèle/maître-esclave pour l'orchestration |
| **Poupée russe (Matriochka)** | Métaphore du forage : chaque niveau en contient un autre, identique mais plus détaillé |

---

## 10. Glossaire

| Terme | Définition |
|-------|------------|
| **Forage (drill-down)** | Action d'ouvrir un container pour voir ses sous-blocs. Plus on fore, plus on personnalise. |
| **Profondeur (depth)** | Niveau dans l'arbre. 0 = boîte noire, N = code atomique. |
| **Container** | Bloc qui peut être ouvert pour révéler ses enfants. |
| **Leaf** | Bloc atomique, non ouvrable. Dernier niveau du forage. |
| **Expand** | Action d'ouvrir un container dans l'interface. |
| **Handler** | Fonction Python qui traduit un bloc (à une profondeur donnée) en appel PyTorch/sklearn. |
| **Runtime Engine** | VM qui parcourt l'arbre récursivement et exécute les handlers selon la profondeur. |
| **Workspace** | Toile où l'utilisateur assemble ses blocs. |
| **Mutator** | Mécanisme pour ajouter/enlever des entrées dynamiquement (+/-). |
| **Slot** | Connecteur d'entrée sur un bloc (type: block, variable, child_ref, number). |
