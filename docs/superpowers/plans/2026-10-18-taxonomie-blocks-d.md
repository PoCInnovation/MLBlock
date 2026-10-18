# Taxonomie des blocks (option D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les 4 axes de classement concurrents par une hiérarchie unique `macro → catégorie → block` portée par les dossiers, supprimer `Stage`, et aligner validation, conversions, superblocks et palette dessus.

**Architecture:** Le dossier d'un block décide de sa macro, de sa catégorie, de sa couleur (nuance calculée de la teinte macro) et de son statut de converteur (`conversions/`). Le backend expose `macro_stage`, `category{name,color,macro}`, `is_transition` ; le frontend consomme ces champs sans table miroir. La validation passe de `Stage` aux rangs de macro + isolation RL par engine.

**Tech Stack:** Python 3.11, FastAPI, Pydantic v2, pytest, uv (backend) ; React 19, TypeScript strict, zod, vitest, pnpm (frontend).

**Spec:** `docs/superpowers/specs/2026-10-18-taxonomie-blocks-d-design.md`

## Global Constraints

- Vocabulaire : Block, Catalog, Pipeline, Job (jamais Bloc/Registry/Graph/Run dans les nouveaux noms publics).
- Chaînes visibles utilisateur en français, identifiants en anglais.
- Backend : `uv` uniquement, commandes depuis `backend/` ; frontend : `pnpm` uniquement, depuis `frontend/`.
- Imports `sklearn`/`gymnasium`/`pandas`/`torchvision` paresseux dans le corps des blocks.
- Blocks = fonctions module-level, nom de fichier = clé ; docstring ligne 1 libellé FR, ligne 2 résumé FR.
- Pas de shim, pas d'alias : cutover propre, tous les appelants migrés.
- Pipelines existants non préservés (pas de migration de données).
- Couleurs macro (seule source `MACRO_STAGE_METADATA`) : Données `#22C55E`, Modèle + Entraînement `#6366F1`, Résultats `#06B6D4`, Transition `#F5A623`.

## Review Focus

1. Fichier `.py` posé au mauvais niveau (racine de macro au lieu d'une catégorie) → il doit être découvert ou faire échouer un test, jamais ignoré silencieusement. Test : `test_every_block_file_is_registered` (Task 3).
2. Deux catégories de même nom dans deux macros → collision dans `categories` du catalog. Test : `test_category_names_unique` (Task 3).
3. Relier `create_env` (Env) à un block Tensor doit proposer `env_to_tensor` ; relier un `nn.Module` à `evaluate_agent` doit proposer `module_to_policy`. Tests : `test_conversion_graph_includes_rl_bridges` (Task 4), `converterFor env→tensor` (Task 7).
4. Un superblock `gym` relié à un block `pytorch` doit être refusé comme un block `gym` simple. Test : `test_rl_isolation_applies_to_gym_superblock` (Task 1).
5. Nuances : 8 catégories dans Modèle doivent donner 8 couleurs distinctes et valides, la première = teinte macro. Test : `test_category_shade_distinct_and_valid` (Task 3).

---

### Task 0: Commiter la suppression des alias

**Files:** déjà modifiés dans l'arbre de travail (`core/adapters.py` supprimé + appelants + tests).

- [ ] **Step 1: Vérifier** — Run: `uv run ruff check . && uv run pytest mlblock/tests -q` · Expected: ruff clean, `241 passed` (DB tests may skip).
- [ ] **Step 2: Commit**

```bash
git add -A backend/mlblock
git commit -m "refactor: remove legacy block aliases (resolve_alias)"
```

---

### Task 1: Validation sur macros + isolation RL par engine

**Files:**
- Modify: `backend/mlblock/validation.py:271-307` (section « stage ordering »)
- Test: `backend/mlblock/tests/test_validation.py`

**Interfaces:**
- Consumes: `registry[type].macro_stage: int`, `registry[type].engine: str`, `registry[type].is_transition: bool` (champs existants de `server/schemas.Block`).
- Produces: messages d'erreur `Ordre invalide : …` et `Isolation RL : …` (Task 2 supprime l'ancien code Stage).

- [ ] **Step 1: Écrire les tests en échec** (utiliser le helper `validate(...)` déjà employé dans `test_validation.py`, avec ports réels des blocks)

```python
def test_macro_order_rejects_results_to_data():      # evaluate -> load_csv
    errs = _validate_edge("evaluate", "load_csv")
    assert any(e.startswith("Ordre invalide") for e in errs)

def test_macro_order_allows_model_to_data_feedback(): # deep_trainer -> load_csv
    assert not any(e.startswith("Ordre invalide") for e in _validate_edge("deep_trainer", "load_csv"))

def test_conversion_exempt_from_order():              # evaluate -> df_to_tensor
    assert not any(e.startswith("Ordre invalide") for e in _validate_edge("evaluate", "df_to_tensor"))

def test_rl_isolation_rejects_env_to_layer():         # create_env -> linear_layer
    assert any(e.startswith("Isolation RL") for e in _validate_edge("create_env", "linear_layer"))

def test_rl_isolation_allows_bridges():
    assert not any(e.startswith("Isolation RL") for e in _validate_edge("create_env", "env_to_tensor"))
    assert not any(e.startswith("Isolation RL") for e in _validate_edge("module_to_policy", "evaluate_agent"))
    assert not any(e.startswith("Isolation RL") for e in _validate_edge("q_learning", "evaluate_agent"))

def test_rl_isolation_applies_to_gym_superblock():    # rl_agent_trainer -> linear_layer
    assert any(e.startswith("Isolation RL") for e in _validate_edge("rl_agent_trainer", "linear_layer"))
```

`_validate_edge(s, t)` : helper local au fichier de test, construit 2 nœuds + 1 arête (premier port de sortie de `s` → premier port d'entrée de `t`) et retourne la liste d'erreurs de `validate`.

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_validation.py -q` · Expected: FAIL (messages absents).
- [ ] **Step 3: Implémenter** dans `validation.py` : remplacer `PERMITTED_FEEDBACK_LOOPS`, `WORLD_BRIDGES` et la boucle Stage par :
  - rang = `registry[t].macro_stage` ; ignorer l'arête si l'un des deux `is_transition` ; erreur si `t_rank < s_rank` et `(s_rank, t_rank) != (2, 1)`.
  - isolation : `(s.engine == "gym") != (t.engine == "gym")` et aucun des deux `is_transition` → erreur.
  - Messages exacts : `f"Ordre invalide : '{src_id}' ({src_label}) ne peut pas alimenter '{tgt_id}' ({tgt_label})."` (labels = `MacroStage(rank).label`) et `f"Isolation RL : '{src_id}' ne peut pas être relié à '{tgt_id}' sans block de conversion."`
  - Retirer l'import `Stage` de `validation.py`.
- [ ] **Step 4: Run** `uv run pytest mlblock/tests -q` · Expected: PASS ; supprimer les tests qui épinglaient les anciens messages `Stage mismatch`.
- [ ] **Step 5: Commit** `git commit -am "feat(validation): macro ordering + RL isolation by engine"`

---

### Task 2: Supprimer `Stage` du backend

**Files:**
- Modify: `backend/mlblock/core/stages.py` (supprimer `Stage`, `STAGE_METADATA`, `STAGE_OF_CATEGORY`, `STAGE_OF_FAMILY`, `STAGE_OF_BLOCK_OVERRIDES`, `STAGE_NOTES`, `stage_of_category`, `stage_of_family`, `stage_of_block`, `get_s2a_substate`, `S2A_*_BLOCKS`)
- Modify: `backend/mlblock/core/type_system.py:56-80` (supprimer `stage_of`)
- Modify: `backend/mlblock/blocks/registry.py` (`_inspect_function` : ne plus calculer `stage`/`stage_name`)
- Modify: `backend/mlblock/server/schemas.py` (retirer `stage`, `stage_name` de `Block`, `BlockSummary`, `BlockResponse` ; supprimer `StageInfo` si inutilisé hors `macro_stages`, sinon le garder pour les macros)
- Modify: `backend/mlblock/catalog.py` (supprimer `stages()` méthode + fonction module)
- Modify: `backend/mlblock/server/routes.py` (`get_catalog` : retirer `stage*` des blocks et la clé `stages`)
- Modify: `backend/mlblock/core/superblocks.py` (retirer `stage`, `stage_name` des 12 défs et de `register_superblocks`)
- Modify: `backend/mlblock/__main__.py` (retirer l'usage de `Stage` s'il existe)
- Test: `test_stages.py`, `test_type_system.py`, `test_types.py`, `test_block.py`, `test_server.py`

**Interfaces:**
- Produces: `Block` sans `stage`/`stage_name` ; réponse `GET /api/catalog` sans `stages`, chaque block garde `macro_stage`, `macro_stage_name`, `engine`, `is_transition`.

- [ ] **Step 1: Test en échec** dans `test_server.py` (fixture `catalog_client`) :

```python
def test_catalog_has_no_stage_fields(catalog_client):
    data = catalog_client.get("/api/catalog").json()
    assert "stages" not in data
    blk = next(iter(_all_blocks(data)))   # helper existant ou itération sur categories[*].blocks
    assert "stage" not in blk and "stage_name" not in blk
    assert {"macro_stage", "engine", "is_transition"} <= blk.keys()
```

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_server.py -q -k no_stage` · Expected: FAIL.
- [ ] **Step 3: Supprimer** les symboles listés ; `grep -rn "Stage\b\|stage_of\|stage_name\|get_s2a_substate" mlblock --include=*.py` doit ne plus rien rendre hors `MacroStage`/`macro_stage*`.
- [ ] **Step 4: Tests** — supprimer dans `test_stages.py` tout ce qui teste `Stage`/`stage_of_*`/`get_s2a_substate` (garder `MacroStage`, engine, `needs_cuda`) ; supprimer `test_type_system_stage_of`, `test_type_system_facade_backward_compat` (partie stage). Run `uv run ruff check . && uv run pytest mlblock/tests -q` · Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "refactor: drop Stage (S0-SX) in favour of MacroStage"`

---

### Task 3: Arborescence par dossiers + découverte 2 niveaux + nuances

**Files:**
- Move (`git mv`) : tous les blocks selon la table ci-dessous
- Modify: `backend/mlblock/blocks/registry.py` (`_discover`, `_inspect_function`, supprimer `_color_from_folder`)
- Modify: `backend/mlblock/core/stages.py` (ajouts ci-dessous ; supprimer `MACRO_OF_CATEGORY`, `macro_of_category`, `MACRO_OF_BLOCK_OVERRIDES`, `TRANSITION_BLOCKS` ; rekey `ENGINE_OF_CATEGORY` ; retirer les 4 entrées `transition` de `ENGINE_OF_BLOCK_OVERRIDES`)
- Modify: `backend/mlblock/server/schemas.py` (`Category` + champ `macro: int`)
- Modify: `backend/mlblock/server/routes.py` (`get_catalog` : exposer `macro` dans chaque catégorie)
- Delete: `blocks/modeles-F59E0B/tsne.py` (clé masquée par `visualisation/tsne.py`)
- Modify (chemins) : `tests/test_runtime_codegen.py:59-92`, `tests/test_file_assets.py:259,422`, `tests/test_block.py:115`, `tests/test_three_stage.py:220-238`, `scripts/audit_coverage.py:282-284`
- Test: `backend/mlblock/tests/test_taxonomy.py` (nouveau)

**Table de déplacement** (cible sous `backend/mlblock/blocks/`) :

| Cible | Blocks |
|---|---|
| `1-donnees/donnees/` | data_pipeline, load_csv, load_image, load_sklearn_dataset, load_text, load_torch_dataset, sequence_dataset, torch_dataset |
| `1-donnees/chargement/` | data_loader, df_to_loader, indices_to_loader, random_split, tensor_dataset, train_test_split |
| `1-donnees/pretraitement/` | normalize, polynomial_features, random_crop, random_flip, resize, standard_scaler |
| `1-donnees/texte/` | build_vocab, encode_text, tokenize |
| `1-donnees/environnement/` | create_env |
| `2-modele/couches/` | tous les fichiers de `layers-6366F1/` sauf maxpool2d_layer et relu_layer ; + gru, lstm, multihead_attention, rnn (de `sequences-8B5CF6/`) |
| `2-modele/activation/` | tous ceux de `activation-EF4444/` + relu_layer |
| `2-modele/normalisation/` | tous ceux de `normalisation-10B981/` |
| `2-modele/regroupement/` | tous ceux de `regroupement-F59E0B/` + maxpool2d_layer |
| `2-modele/modeles/` | ceux de `modeles-F59E0B/` sauf standard_scaler et tsne |
| `2-modele/entrainement/` | ceux de `entrainement-DE497D/` sauf confusion_matrix, evaluate, mlflow_model_exporter, silhouette |
| `2-modele/agents/` | q_learning |
| `3-resultats/evaluation/` | confusion_matrix, evaluate, evaluate_agent, mlflow_model_exporter, silhouette |
| `3-resultats/visualisation/` | plot_predictions, tsne |
| `conversions/` | df_to_tensor, to_tensor, env_to_tensor, module_to_policy |

Chaque dossier garde un `__init__.py` vide comme aujourd'hui. Supprimer les anciens dossiers vides.

**Interfaces:**
- Produces (dans `core/stages.py`) :
  - `macro_of_folder(folder_name: str) -> MacroStage` — `"conversions"` → `TRANSITION`, `"N-slug"` → `MacroStage(N)`, sinon `ValueError`.
  - `category_shade(hex_color: str, index: int, count: int) -> str` — `t = 0.5 * index / max(count - 1, 1)`, chaque canal `round(c + (255 - c) * t)`, retour `#RRGGBB` majuscules ; `index 0` = couleur d'entrée.
  - `macro_of_block(block_name: str) -> MacroStage` — lit `BLOCK_REGISTRY[name].macro_stage` ; superblocks via leur `macro_stage`.
  - `is_transition_block(block_name: str) -> bool` — lit `BLOCK_REGISTRY[name].is_transition`.
  - `ENGINE_OF_CATEGORY` : donnees/chargement/pretraitement/texte/evaluation → `generic` ; environnement/agents → `gym` ; couches/activation/normalisation/regroupement/entrainement → `pytorch` ; modeles → `sklearn` ; visualisation → `viz` ; conversions → `transition`.
- Produces (`schemas.Category`) : `name: str`, `color: str`, `macro: int`. `Block.is_transition = (macro == TRANSITION)` ; `Block.macro_stage = int(macro)`.
- Catégories dans une macro : ordre alphabétique des dossiers → index de nuance. `conversions/` = une catégorie `conversions`, couleur Transition non nuancée.

- [ ] **Step 1: Tests en échec** `tests/test_taxonomy.py` :

```python
from pathlib import Path
from mlblock.blocks.registry import BLOCK_REGISTRY
from mlblock.core.stages import MacroStage, category_shade, macro_of_folder

BLOCKS = Path(__file__).resolve().parents[1] / "blocks"

def test_every_block_file_is_registered():
    stems = {p.stem for p in BLOCKS.rglob("*.py") if not p.name.startswith("_") and p.name != "registry.py"}
    assert stems <= BLOCK_REGISTRY.keys()

def test_no_block_file_at_macro_root():
    for macro in BLOCKS.iterdir():
        if macro.is_dir() and macro.name[0].isdigit():
            assert not [p for p in macro.glob("*.py") if not p.name.startswith("_")]

def test_category_names_unique():
    cats = [d.name for m in BLOCKS.iterdir() if m.is_dir() and m.name[0].isdigit() for d in m.iterdir() if d.is_dir() and not d.name.startswith("_")]
    assert len(cats) == len(set(cats))

def test_macro_and_transition_from_folder():
    assert BLOCK_REGISTRY["load_csv"].macro_stage == 1
    assert BLOCK_REGISTRY["linear_layer"].macro_stage == 2
    assert BLOCK_REGISTRY["evaluate"].macro_stage == 3
    assert BLOCK_REGISTRY["env_to_tensor"].macro_stage == MacroStage.TRANSITION
    assert BLOCK_REGISTRY["env_to_tensor"].is_transition and not BLOCK_REGISTRY["normalize"].is_transition
    assert BLOCK_REGISTRY["linear_layer"].category.name == "couches"

def test_macro_of_folder():
    assert macro_of_folder("2-modele") == MacroStage.MODEL_TRAIN
    assert macro_of_folder("conversions") == MacroStage.TRANSITION

def test_category_shade_distinct_and_valid():
    shades = [category_shade("#6366F1", i, 8) for i in range(8)]
    assert shades[0] == "#6366F1"
    assert len(set(shades)) == 8
    assert all(len(s) == 7 and s.startswith("#") for s in shades)
```

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_taxonomy.py -q` · Expected: FAIL.
- [ ] **Step 3: Déplacer** les fichiers (`git mv`) selon la table, supprimer `modeles-F59E0B/tsne.py`.
- [ ] **Step 4: Implémenter** `macro_of_folder`, `category_shade`, le nouveau `_discover` (parcourt `blocks/<macro>/<catégorie>/*.py`, et `blocks/conversions/*.py`, ignore les noms commençant par `_` et `__pycache__`), `module_name = f"mlblock.blocks.{macro}.{categorie}.{stem}"` (préfixer `m_` si l'importlib refuse un segment commençant par un chiffre).
- [ ] **Step 5: Mettre à jour** les chemins des tests et de `scripts/audit_coverage.py` listés plus haut.
- [ ] **Step 6: Run** `uv run ruff check . && uv run pytest mlblock/tests -q` · Expected: PASS.
- [ ] **Step 7: Commit** `git commit -am "refactor(blocks): folder hierarchy macro/category, shades, conversions/"`

---

### Task 4: Graphe de conversion depuis `is_transition`

**Files:**
- Modify: `backend/mlblock/core/types.py:58-72` (`build_conversion_graph`)
- Modify: `backend/mlblock/core/type_system.py:84-120` (supprimer `quick_map`, filtre sur `is_transition`)
- Modify: `backend/mlblock/validation.py:177` (message : lister dynamiquement les blocks `is_transition`)
- Test: `backend/mlblock/tests/test_types.py`

**Interfaces:**
- Consumes: `Block.is_transition` (Task 3).
- Produces: `build_conversion_graph(registry) -> dict[str, set[str]]` incluant `env → tensor` et `module → policy`.

- [ ] **Step 1: Test en échec**

```python
def test_conversion_graph_includes_rl_bridges():
    g = build_conversion_graph(BLOCK_REGISTRY)
    assert g["df"] == {"tensor"} and "tensor" in g["image"] and "tensor" in g["ndarray"]
    assert g["env"] == {"tensor"}
    assert g["module"] == {"policy"}

def test_converter_for_has_no_bogus_df_to_image():
    assert TypeSystem().converter_for("pd.DataFrame", "PIL.Image.Image", BLOCK_REGISTRY) is None
```

(Adapter le nom de la méthode à celle définie dans `type_system.py:84` — celle qui contient `quick_map`.)

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_types.py -q` · Expected: FAIL.
- [ ] **Step 3: Remplacer** les deux `if cat != "transformations"` par `if not block.is_transition` et supprimer `quick_map`.
- [ ] **Step 4: Run** `uv run pytest mlblock/tests -q` · Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "fix(types): conversion graph from conversions/ (adds env/policy bridges)"`

---

### Task 5: Blocks de Modèle en `nn.Module` (plus aucun format Tensor)

**Files:**
- Delete: `2-modele/couches/embedding.py`, `rnn.py`, `lstm.py`, `2-modele/activation/identity.py`
- Modify: `2-modele/couches/rnn_layer.py` (+ `num_layers: int = 1`, `nonlinearity: Literal["tanh","relu"] = "tanh"`, `bias: bool = True`, `dropout: float = 0.0`, `bidirectional: bool = False` ; docstring reprenant les métadonnées de l'ancien `rnn`)
- Modify (même nom, devient Module) : avec poids `couches/gru.py`, `couches/multihead_attention.py`, `activation/prelu.py`, `normalisation/instancenorm2d.py` ; sans poids `activation/selu.py`, `activation/silu.py`, `regroupement/avgpool2d.py`, `regroupement/adaptive_avgpool2d.py`, `regroupement/adaptive_maxpool2d.py`, `couches/upsample.py` (mêmes paramètres qu'aujourd'hui)
- Modify: `tests/test_runtime_codegen.py:76-92` (supprimer les cas lstm/rnn tensor, adapter gru/mha au format Module)
- Modify: `tests/test_runtime_codegen.py:59-67` (cas pooling au format Module), `tests/test_pipeline.py:80` (`avgpool2d` exécuté sur un tensor → l'exécuter comme Module), `tests/test_types.py:376` (arête vers `avgpool2d` : adapter aux ports Module)
- Modify: `tests/test_audit_coverage.py:20` (`111` → `107`)
- Pas de changement dans `core/generator.py` : les conteneurs ne contenant que des Modules passent déjà par la branche `nn.Sequential` (`generator.py:334-344`)

**Interfaces:**
- Produces: format Module identique à `lstm_layer`/`rnn_layer` : paramètres, puis `in_1: "torch.nn.Module" = None`, retour `"torch.nn.Module"` ; `nn.Sequential(in_1, layer) if in_1 is not None else layer`. `gru`/`multihead_attention` renvoient la sortie seule (pas le tuple), dernier pas de temps pour `gru` comme `_RNNOut`.

- [ ] **Step 1: Tests en échec** dans `test_runtime_codegen.py` :

```python
import torch, torch.nn as nn

def test_parametric_blocks_are_trainable_modules():
    for name, kwargs, x in [
        ("gru", {"input_size": 4, "hidden_size": 8}, torch.randn(2, 5, 4)),
        ("multihead_attention", {"embed_dim": 8, "num_heads": 2}, torch.randn(2, 5, 8)),
        ("prelu", {}, torch.randn(2, 3)),
        ("instancenorm2d", {"num_features": 3}, torch.randn(2, 3, 4, 4)),
    ]:
        m = _fn(name)(**kwargs)               # _fn : récupère la fonction depuis BLOCK_REGISTRY/BLOCK_SOURCES comme le fait le fichier
        assert isinstance(m, nn.Module) and list(m.parameters())
        assert isinstance(m(x), torch.Tensor)

def test_rnn_layer_exposes_full_params():
    m = _fn("rnn_layer")(input_size=4, hidden_size=8, num_layers=2, bidirectional=True)
    assert m(torch.randn(2, 5, 4)).shape == (2, 16)

def test_removed_ephemeral_blocks():
    assert not {"embedding", "rnn", "lstm", "identity"} & BLOCK_REGISTRY.keys()

def test_model_layer_blocks_have_no_tensor_ports():
    for b in BLOCK_REGISTRY.values():
        if b.macro_stage == 2 and b.category.name in {"couches", "activation", "normalisation", "regroupement"} and b.name not in {"input", "input_layer"}:
            assert all(p["dtype"] == "torch.nn.Module" for p in b.inputs), b.name
            assert [p["dtype"] for p in b.outputs] == ["torch.nn.Module"], b.name

def test_layer_container_composes_into_sequential():
    node = PipelineNode(id="m", type="sequential_model", params={}, children=[
        PipelineNode(id="c", type="conv2d_layer", params={"in_channels": 1, "out_channels": 4}),
        PipelineNode(id="p", type="avgpool2d", params={}),
        PipelineNode(id="f", type="flatten_layer", params={}),
    ])
    assert validate([node.model_dump()], []).valid
    assert "nn.Sequential(" in generate_code([node], [])
```

Exceptions assumées : `input` (block virtuel de forme, sortie `torch.Tensor`) et `input_layer` (seul pont Tensor → Module : point d'entrée de la chaîne de modèle, alimenté par `df_to_tensor`/`env_to_tensor` dans les exos A4 et C2).

Pour `instancenorm2d`, utiliser `nn.InstanceNorm2d(num_features, affine=True)` (sinon pas de paramètres).

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_runtime_codegen.py -q` · Expected: FAIL.
- [ ] **Step 3: Implémenter** les conversions, suppressions et le renommage.
- [ ] **Step 4: Run** `uv run ruff check . && uv run pytest mlblock/tests -q` · Expected: PASS (12 exos toujours valides dans `test_audit_coverage`).
- [ ] **Step 5: Commit** `git commit -am "refactor(blocks): parametric blocks as nn.Module, drop ephemeral duplicates"`

---

### Task 6: Superblocks — couleur de macro

**Files:**
- Modify: `backend/mlblock/core/superblocks.py` (`register_superblocks` : `Category(name="superblocks", color=MacroStage(macro).color, macro=macro)`)
- Test: `backend/mlblock/tests/test_three_stage.py`

**Interfaces:**
- Consumes: `Category.macro` (Task 3), `MacroStage.color`.

- [ ] **Step 1: Test en échec**

```python
def test_superblock_color_is_macro_color():
    assert BLOCK_REGISTRY["clustering_visualizer"].category.color == "#06B6D4"
    assert BLOCK_REGISTRY["tabular_data_pipeline"].category.color == "#22C55E"
    assert BLOCK_REGISTRY["clustering_visualizer"].category.macro == 3
```

- [ ] **Step 2: Run** `uv run pytest mlblock/tests/test_three_stage.py -q -k macro_color` · Expected: FAIL.
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Run** `uv run pytest mlblock/tests -q` · Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "fix(superblocks): colour from their macro"`

---

### Task 7: Contrat frontend — suppression de `Stage`, conversions par `is_transition`

**Files:**
- Delete: `frontend/src/utils/stages.ts`, `frontend/src/utils/stages.test.ts`, `frontend/src/utils/shapeTracker.ts`, `frontend/src/utils/shapeTracker.test.ts` (code mort : `trackShapes`/`parseShapeString`/`formatShape` n'ont aucun appelant hors de leur test d'après codegraph ; il code en dur des noms supprimés : alias `conv2d`/`linear`/`relu`/`maxpool2d`/`flatten`/`dropout` et `identity`)
- Modify: `frontend/src/schemas/api.ts` (retirer `stage`, `stage_name`, `stages` ; catégorie + `macro: z.number()`)
- Modify: `frontend/src/types/catalog.ts` (idem ; `Category` + `macro: number`)
- Modify: `frontend/src/api/client.ts:113,132-146` (mapping)
- Modify: `frontend/src/utils/typeSystem.ts` (supprimer `stageOf`/`stage_of` et imports ; ligne 103 → `if (!def.is_transition) continue`)
- Modify: `frontend/src/utils/typeCheck.ts:34-38,76` (filtre `def.is_transition`)
- Modify: `frontend/src/store/pipelineDocument.ts:9,78-79` (`backfillNodes`, appelé par `useAppStore.setCatalog`), `frontend/src/components/flow/BlockNode.tsx:23-24`, `frontend/src/components/flow/FlowCanvas.tsx:40,63,193-194,235,257,590,675-676,715-720` (retirer `stage*` des données de nœud — seul lecteur : l'inspecteur ; dans `NodeInspector`, supprimer `stageNum`/`stageConfig` et le `Badge` qui affiche `stageConfig.key` (S0…SX), sans remplacement ; supprimer `MACRO_FALLBACK`, le titre de section utilise `catalog.macro_stages` seul)
- Test: `frontend/src/utils/typeCheck.test.ts` (supprimer les tests `stageOf`), `frontend/src/api/catalog-parse.test.ts` (fixtures sans `stage*`, avec `macro`)

**Interfaces:**
- Consumes: payload `GET /api/catalog` des Tasks 2–3.
- Produces: `BlockDef.is_transition: boolean` utilisé par le graphe ; `Category = { id, name, color, macro }`.

- [ ] **Step 1: Test en échec** dans `typeCheck.test.ts` :

```ts
it('converterFor proposes RL bridges from is_transition', () => {
  const blocks = {
    env_to_tensor: { ...base, cat: 'conversions', is_transition: true, inputs: [{ name: 'in_1', dtype: 'Env' }], outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }] },
    normalize: { ...base, cat: 'pretraitement', is_transition: false, inputs: [{ name: 'in_1', dtype: 'torch.utils.data.Dataset' }], outputs: [{ name: 'out_1', dtype: 'torch.Tensor' }] },
  }
  expect(converterFor('Env', 'torch.Tensor', blocks)).toBe('env_to_tensor')
  expect(converterFor('torch.utils.data.Dataset', 'torch.Tensor', blocks)).toBeNull()
})
```

(`base` : fixture BlockDef minimale déjà utilisée dans le fichier.)

- [ ] **Step 2: Run** `pnpm test -- typeCheck` · Expected: FAIL.
- [ ] **Step 3: Implémenter** les suppressions et le filtre.
- [ ] **Step 4: Run** `pnpm test && pnpm run build && pnpm lint` · Expected: PASS, 0 warning.
- [ ] **Step 5: Commit** `git commit -am "refactor(front): drop Stage, conversion graph from is_transition"`

---

### Task 8: Palette hiérarchique + badge engine

**Files:**
- Modify: `frontend/src/utils/superblocks.ts` (ajouter `groupBlocks` ; `blockCardInfo` : superblock → couleur de sa macro, badge = engine)
- Modify: `frontend/src/components/flow/FlowCanvas.tsx:603-610` (mode avancé : sections macro → sous-sections catégorie)
- Modify: `frontend/src/components/flow/BlockCard.tsx:65-71` (badge : `info.badge`). `BlockCard`/`blockCardInfo` sont aussi rendus par `BlockNode`, `CompatSheet` et `SuperBlockConfigSheet` : le changement s'y applique tel quel, à contrôler à l'étape de vérification visuelle
- Test: `frontend/src/utils/superblocks.test.ts`

**Interfaces:**
- Produces:
  - `groupBlocks(catalog: InternalCatalog, engineFilter: string): { macro: StageInfo; categories: { category: Category; types: string[] }[] }[]` — macros par id croissant (Transition en dernier), catégories par nom, types filtrés par `matchEngine`, groupes vides omis, superblocks exclus.
  - `BlockCardInfo.badge: string` — `sb.engine` pour un superblock, `categoryName` sinon. `color`/`categoryColor` d'un superblock = `catalog.macro_stages.find(m => m.id === sb.macro_stage).color`.

- [ ] **Step 1: Tests en échec**

```ts
it('groupBlocks nests categories under macros, transition last, empty groups dropped', () => {
  const g = groupBlocks(fixtureCatalog, 'all')
  expect(g.map(x => x.macro.id)).toEqual([1, 2, 3, 99])
  expect(g[1].categories.map(c => c.category.id)).toEqual([...g[1].categories.map(c => c.category.id)].sort())
  expect(groupBlocks(fixtureCatalog, 'gym').flatMap(x => x.categories).every(c => c.types.length > 0)).toBe(true)
})

it('blockCardInfo: superblock uses macro colour and engine badge', () => {
  const info = blockCardInfo(fixtureCatalog, 'clustering_visualizer')
  expect(info.color).toBe('#06B6D4')
  expect(info.badge).toBe('sklearn')
  expect(blockCardInfo(fixtureCatalog, 'load_csv').badge).toBe('Donnees')
})
```

`fixtureCatalog` : catalogue minimal local au test couvrant les 4 macros, au moins 2 catégories en macro 2, un superblock `clustering_visualizer` (macro 3, engine sklearn) et `load_csv` (catégorie `donnees`).

- [ ] **Step 2: Run** `pnpm test -- superblocks` · Expected: FAIL.
- [ ] **Step 3: Implémenter** `groupBlocks`, `badge`, le rendu en mode avancé (titre de section = `macro.label`, sous-titre = `category.name`, en réutilisant le style des titres du mode simple) et le badge de `BlockCard`.
- [ ] **Step 4: Run** `pnpm test && pnpm run build && pnpm lint` · Expected: PASS.
- [ ] **Step 5: Vérifier visuellement** : `uv run python -m mlblock.server` + `pnpm dev`, ouvrir l'éditeur, palette mode simple et avancé : 3 sections + Conversions, nuances distinctes par catégorie, badge engine sur les superblocks uniquement.
- [ ] **Step 6: Commit** `git commit -am "feat(palette): macro > category hierarchy, engine badge on superblocks"`

---

### Task 9: Documentation

**Files:**
- Modify: `AGENTS.md` (sections Project Overview « Stages », Bridge, Key Directories : nouvelle arborescence, suppression de `convolution-6366F1`/S0–SX, ~107 blocks, `core/adapters.py` absent)
- Modify: `docs/mlblock_v1.md` (taxonomie, règles de validation)

- [ ] **Step 1: Mettre à jour** les deux fichiers pour refléter la spec (hiérarchie, couleurs, conversions, validation).
- [ ] **Step 2: Vérifier** `grep -rn "S0\|S2A\|stage_of\|convolution-6366F1\|resolve_alias" AGENTS.md docs/mlblock_v1.md` · Expected: aucune occurrence obsolète.
- [ ] **Step 3: Commit** `git commit -am "docs: block taxonomy D"`
