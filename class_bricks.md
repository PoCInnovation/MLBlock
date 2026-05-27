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