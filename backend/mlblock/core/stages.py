from __future__ import annotations

from enum import IntEnum
from typing import Any


class MacroStage(IntEnum):
    """3 canonical industry pipeline stages + transition bridges.

    Pedagogical grouping exposed by the backend-three-stage-blocks change:

    DATA:         Données / Environnement + Préparation (ingestion, envs
                  Gymnasium, nettoyage, encodage, découpage, DataLoader).
    MODEL_TRAIN:  Modèle + Entraînement (architectures nn.Module,
                  estimateurs sklearn, boosting, optimiseurs, boucles).
    RESULTS:      Évaluation + Visualisation (métriques, tracés, packaging).
    TRANSITION:   Passerelles de conversion inter-frameworks
                  (df_to_tensor, to_tensor, env_to_tensor, module_to_policy).
    """

    DATA = 1
    MODEL_TRAIN = 2
    RESULTS = 3
    TRANSITION = 99

    @property
    def stage_name(self) -> str:
        return MACRO_STAGE_METADATA[self]["name"]

    @property
    def label(self) -> str:
        return MACRO_STAGE_METADATA[self]["label"]

    @property
    def color(self) -> str:
        return MACRO_STAGE_METADATA[self]["color"]

    @classmethod
    def all_stages(cls) -> list[MacroStage]:
        return [cls.DATA, cls.MODEL_TRAIN, cls.RESULTS, cls.TRANSITION]


MACRO_STAGE_METADATA: dict[MacroStage, dict[str, Any]] = {
    MacroStage.DATA: {"id": 1, "name": "Data", "label": "Données", "color": "#22C55E"},
    MacroStage.MODEL_TRAIN: {"id": 2, "name": "ModelTrain", "label": "Modèle + Entraînement", "color": "#6366F1"},
    MacroStage.RESULTS: {"id": 3, "name": "Results", "label": "Résultats", "color": "#06B6D4"},
    MacroStage.TRANSITION: {"id": 99, "name": "Transition", "label": "Transition", "color": "#F5A623"},
}

MACRO_OF_CATEGORY: dict[str, MacroStage] = {
    # Étape 1 : Données / Environnement + Préparation
    "donnees": MacroStage.DATA,
    "chargement": MacroStage.DATA,
    "transformations": MacroStage.DATA,
    "texte": MacroStage.DATA,
    "renforcement": MacroStage.DATA,
    # Étape 2 : Modèle + Entraînement
    "layers": MacroStage.MODEL_TRAIN,
    "activation": MacroStage.MODEL_TRAIN,
    "normalisation": MacroStage.MODEL_TRAIN,
    "regroupement": MacroStage.MODEL_TRAIN,
    "sequences": MacroStage.MODEL_TRAIN,
    "modeles": MacroStage.MODEL_TRAIN,
    "entrainement": MacroStage.MODEL_TRAIN,
    # Étape 3 : Évaluation + Visualisation
    "visualisation": MacroStage.RESULTS,
}

# Block overrides where the block macro-stage differs from its category.
# The 4 transition bridges always map to TRANSITION; eval-flavoured blocks
# hosted in the training category map to RESULTS.
MACRO_OF_BLOCK_OVERRIDES: dict[str, MacroStage] = {
    "df_to_tensor": MacroStage.TRANSITION,
    "to_tensor": MacroStage.TRANSITION,
    "env_to_tensor": MacroStage.TRANSITION,
    "module_to_policy": MacroStage.TRANSITION,
    "evaluate": MacroStage.RESULTS,
    "confusion_matrix": MacroStage.RESULTS,
    "silhouette": MacroStage.RESULTS,
    "plot_predictions": MacroStage.RESULTS,
    "mlflow_model_exporter": MacroStage.RESULTS,
}


def macro_of_category(category_name: str) -> MacroStage:
    """Map category folder or category name to its MacroStage."""
    cat = category_name.split("-")[0].strip().lower()
    return MACRO_OF_CATEGORY.get(cat, MacroStage.DATA)


def macro_of_block(block_name: str, category: str | None = None) -> MacroStage:
    """Map a block name (and optional category) to its MacroStage."""

    canonical = block_name
    if canonical in MACRO_OF_BLOCK_OVERRIDES:
        return MACRO_OF_BLOCK_OVERRIDES[canonical]

    try:
        from mlblock.core.superblocks import SUPERBLOCK_DEFS

        if canonical in SUPERBLOCK_DEFS:
            return MacroStage(int(SUPERBLOCK_DEFS[canonical]["macro_stage"]))
    except Exception:
        pass

    if category:
        return macro_of_category(category)

    try:
        from mlblock.catalog import catalog

        block = catalog.get(canonical)
        if block is not None:
            cat = getattr(block.category, "name", None) or str(block.category)
            return macro_of_category(cat)
    except Exception:
        pass

    return MacroStage.DATA


# ── Framework engine tags (strict per-framework sealing) ──────────────
# Each block declares the runtime framework it belongs to. Engines
# "sklearn" / "pytorch" / "gym" are mutually exclusive inside a SuperBlock
# (see validation.validate_container_children); "mlflow" / "viz" /
# "generic" are cross-cutting and allowed anywhere; "transition" marks the
# 4 conversion bridges allowed at container boundaries.

ENGINE_OF_CATEGORY: dict[str, str] = {
    "donnees": "generic",
    "chargement": "generic",
    "transformations": "generic",
    "texte": "generic",
    "layers": "pytorch",
    "activation": "pytorch",
    "normalisation": "pytorch",
    "regroupement": "pytorch",
    "sequences": "pytorch",
    "modeles": "sklearn",
    "entrainement": "pytorch",
    "visualisation": "viz",
    "renforcement": "gym",
}

ENGINE_OF_BLOCK_OVERRIDES: dict[str, str] = {
    # Transition bridges (also MacroStage.TRANSITION)
    "df_to_tensor": "transition",
    "to_tensor": "transition",
    "env_to_tensor": "transition",
    "module_to_policy": "transition",
    # sklearn blocks hosted outside modeles-*
    "load_csv": "sklearn",
    "load_sklearn_dataset": "sklearn",
    "train_test_split": "sklearn",
    "standard_scaler": "sklearn",
    "logistic_regression": "sklearn",
    "random_forest": "sklearn",
    "decision_tree": "sklearn",
    "svm": "sklearn",
    "linear_regression": "sklearn",
    "kmeans": "sklearn",
    "pca": "sklearn",
    "tsne": "sklearn",
    "evaluate": "sklearn",
    "confusion_matrix": "sklearn",
    # pytorch data pipeline hosted in donnees-*
    "load_torch_dataset": "pytorch",
    "data_loader": "pytorch",
    "normalize": "pytorch",
    "random_crop": "pytorch",
    "random_flip": "pytorch",
    "resize": "pytorch",
    # gym / rl hosted in entrainement-*
    "q_learning": "gym",
    "evaluate_agent": "gym",
    # mlflow tracking
    "mlflow_tracker": "mlflow",
    "mlflow_model_logger": "mlflow",
    "mlflow_model_exporter": "mlflow",
    # static visualisation hosted in entrainement-*
    "plot_predictions": "viz",
    "loss_curve": "viz",
    "silhouette": "viz",
}

TRANSITION_BLOCKS: frozenset[str] = frozenset({
    "df_to_tensor",
    "to_tensor",
    "env_to_tensor",
    "module_to_policy",
})

# Framework engines that must not be mixed inside one SuperBlock.
STRICT_ENGINES: frozenset[str] = frozenset({"sklearn", "pytorch", "gym"})

# All known engine tags (accepted as a declared container engine).
KNOWN_ENGINES: frozenset[str] = frozenset({
    "sklearn", "pytorch", "gym", "mlflow", "viz", "generic", "transition",
})


def engine_of_block(block_name: str, category: str | None = None) -> str:
    """Map a block name (and optional category) to its framework engine."""

    canonical = block_name
    if canonical in ENGINE_OF_BLOCK_OVERRIDES:
        return ENGINE_OF_BLOCK_OVERRIDES[canonical]

    try:
        from mlblock.core.superblocks import SUPERBLOCK_DEFS

        if canonical in SUPERBLOCK_DEFS:
            return str(SUPERBLOCK_DEFS[canonical]["engine"])
    except Exception:
        pass

    if category:
        cat = category.split("-")[0].strip().lower()
        return ENGINE_OF_CATEGORY.get(cat, "generic")

    try:
        from mlblock.catalog import catalog

        block = catalog.get(canonical)
        if block is not None:
            cat = getattr(block.category, "name", None) or str(block.category)
            return ENGINE_OF_CATEGORY.get(cat.split("-")[0].strip().lower(), "generic")
    except Exception:
        pass

    return "generic"


def needs_cuda(nodes: list[Any]) -> bool:
    """True if any node (or nested child) resolves to the pytorch engine.

    Accepts dicts ({"type": ..., "children": [...]}) or models with
    `.type` / `.children` attrs. Unknown types resolve "generic" → False.
    Single owner for the CUDA-image decision (see execution.image_for).
    """

    def _types(ns: list[Any]) -> Any:
        for n in ns or []:
            if isinstance(n, dict):
                t = n.get("type", "")
                children = n.get("children", [])
            else:
                t = getattr(n, "type", "")
                children = getattr(n, "children", []) or []
            yield t
            yield from _types(children)

    return any(engine_of_block(t) == "pytorch" for t in _types(nodes) if t)


def is_transition_block(block_name: str) -> bool:
    """True if the block is a conversion bridge allowed at container boundaries."""
    return block_name in TRANSITION_BLOCKS
