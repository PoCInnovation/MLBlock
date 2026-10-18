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

def macro_of_folder(folder_name: str) -> MacroStage:
    """Macro-stage encoded by a block folder name: `N-slug` or `conversions`."""
    if folder_name == "conversions":
        return MacroStage.TRANSITION
    prefix = folder_name.split("-", 1)[0]
    if prefix.isdigit():
        return MacroStage(int(prefix))
    raise ValueError(f"dossier de bloc inconnu : {folder_name!r}")


def category_shade(hex_color: str, index: int, count: int) -> str:
    """Shade `index` of `count` derived from `hex_color`, lightening toward white.

    Index 0 keeps the input color; higher indices lighten up to 50%.
    """
    r, g, b = (int(hex_color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
    t = 0.5 * index / max(count - 1, 1)
    return "#" + "".join(f"{round(c + (255 - c) * t):02X}" for c in (r, g, b))


def macro_of_block(block_name: str) -> MacroStage:
    """MacroStage of a registered block (SuperBlocks carry their own)."""
    from mlblock.blocks.registry import BLOCK_REGISTRY

    return MacroStage(BLOCK_REGISTRY[block_name].macro_stage)


# ── Framework engine tags (strict per-framework sealing) ──────────────
# Each block declares the runtime framework it belongs to. Engines
# "sklearn" / "pytorch" / "gym" are mutually exclusive inside a SuperBlock
# (see validation.validate_container_children); "mlflow" / "viz" /
# "generic" are cross-cutting and allowed anywhere; "transition" marks the
# 4 conversion bridges allowed at container boundaries.

ENGINE_OF_CATEGORY: dict[str, str] = {
    "donnees": "generic",
    "chargement": "generic",
    "pretraitement": "generic",
    "texte": "generic",
    "environnement": "gym",
    "couches": "pytorch",
    "activation": "pytorch",
    "normalisation": "pytorch",
    "regroupement": "pytorch",
    "modeles": "sklearn",
    "entrainement": "pytorch",
    "agents": "gym",
    "evaluation": "generic",
    "visualisation": "viz",
    "conversions": "transition",
}

ENGINE_OF_BLOCK_OVERRIDES: dict[str, str] = {
    # Transition bridges (MacroStage.TRANSITION via folder `conversions/`)
    "df_to_tensor": "transition",
    "to_tensor": "transition",
    "env_to_tensor": "transition",
    "module_to_policy": "transition",
    # sklearn blocks hosted outside modeles/
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
    # pytorch data pipeline hosted in donnees/ and pretraitement/
    "load_torch_dataset": "pytorch",
    "data_loader": "pytorch",
    "normalize": "pytorch",
    "random_crop": "pytorch",
    "random_flip": "pytorch",
    "resize": "pytorch",
    # rl hosted in agents/ and evaluation/
    "q_learning": "gym",
    "evaluate_agent": "gym",
    # mlflow tracking
    "mlflow_tracker": "mlflow",
    "mlflow_model_logger": "mlflow",
    "mlflow_model_exporter": "mlflow",
    # static visualisation hosted in entrainement/ and evaluation/
    "plot_predictions": "viz",
    "loss_curve": "viz",
    "silhouette": "viz",
}


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
        return ENGINE_OF_CATEGORY.get(category, "generic")

    try:
        from mlblock.catalog import catalog

        block = catalog.get(canonical)
        if block is not None:
            return ENGINE_OF_CATEGORY.get(block.category.name, "generic")
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
    from mlblock.blocks.registry import BLOCK_REGISTRY

    return BLOCK_REGISTRY[block_name].is_transition
