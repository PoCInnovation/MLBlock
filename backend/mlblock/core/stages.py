from __future__ import annotations

from enum import IntEnum
from typing import Any


class Stage(IntEnum):
    """5 CRISP-DM IA stages + RL World stage.

    S0 Ingest:      Données & chargement (df, image, ndarray, str, list)
    S1 Prepare:     Prétraitements & transformations (df/image/ndarray -> tensor)
    S2 Represent:   Architecture modèle (S2A DL nn.Module, S2B ML Model)
    S3 Train:       Entraînement (optim, loss, train_epoch, train_model)
    S4 Eval:        Évaluation & métriques (evaluate, confusion_matrix, visualisation)
    SX World:       Environnement RL isolé (create_env, evaluate_agent, q_learning)
    """

    INGEST = 0
    PREPARE = 1
    REPRESENT = 2
    TRAIN = 3
    EVAL = 4
    WORLD = 9

    # Canonical aliases (variants)
    REPRESENT_DL = 2
    REPRESENT_ML = 2
    TRAIN_DL = 3
    TRAIN_ML = 3

    @property
    def stage_name(self) -> str:
        return STAGE_METADATA[self]["name"]

    @property
    def label(self) -> str:
        return STAGE_METADATA[self]["label"]

    @property
    def color(self) -> str:
        return STAGE_METADATA[self]["color"]

    @classmethod
    def all_stages(cls) -> list[Stage]:
        return [cls.INGEST, cls.PREPARE, cls.REPRESENT, cls.TRAIN, cls.EVAL, cls.WORLD]


STAGE_METADATA: dict[Stage, dict[str, Any]] = {
    Stage.INGEST: {"id": 0, "name": "Ingest", "label": "Données", "color": "#22C55E"},
    Stage.PREPARE: {"id": 1, "name": "Prepare", "label": "Préparation", "color": "#F5A623"},
    Stage.REPRESENT: {"id": 2, "name": "Represent", "label": "Modèle", "color": "#6366F1"},
    Stage.TRAIN: {"id": 3, "name": "Train", "label": "Entraînement", "color": "#DE497D"},
    Stage.EVAL: {"id": 4, "name": "Eval", "label": "Évaluation", "color": "#06B6D4"},
    Stage.WORLD: {"id": 9, "name": "World", "label": "Monde RL", "color": "#E8C77A"},
}

STAGE_OF_CATEGORY: dict[str, Stage] = {
    # S0 Ingest
    "donnees": Stage.INGEST,
    "chargement": Stage.INGEST,
    # S1 Prepare
    "transformations": Stage.PREPARE,
    "texte": Stage.PREPARE,
    # S2 Represent
    "layers": Stage.REPRESENT,
    "activation": Stage.REPRESENT,
    "normalisation": Stage.REPRESENT,
    "regroupement": Stage.REPRESENT,
    "sequences": Stage.REPRESENT,
    "modeles": Stage.REPRESENT,
    # S3 Train
    "entrainement": Stage.TRAIN,
    # S4 Eval
    "visualisation": Stage.EVAL,
    # SX World
    "renforcement": Stage.WORLD,
}

STAGE_OF_FAMILY: dict[str, Stage] = {
    "df": Stage.INGEST,
    "image": Stage.INGEST,
    "ndarray": Stage.INGEST,
    "str": Stage.INGEST,
    "list": Stage.INGEST,
    "tensor": Stage.PREPARE,
    "tuple": Stage.PREPARE,
    "any": Stage.PREPARE,
    "module": Stage.REPRESENT,
    "model": Stage.REPRESENT,
    "dataset": Stage.TRAIN,
    "optim": Stage.TRAIN,
    "dict": Stage.TRAIN,
    "scalar": Stage.EVAL,
    "env": Stage.WORLD,
    "policy": Stage.WORLD,
}

# Block overrides where block stage differs from its parent category
STAGE_OF_BLOCK_OVERRIDES: dict[str, Stage] = {
    "evaluate": Stage.EVAL,
    "confusion_matrix": Stage.EVAL,
    "silhouette": Stage.EVAL,
    "plot_predictions": Stage.EVAL,
}

# S2A sub-state annotations / notes:
# S2A-CNN: Vision / Convolutional networks (conv, pooling, etc.)
# S2A-Seq: Sequential / NLP / Time series (tokenize, vocab, embedding, lstm, gru, etc.)
# Both share Stage 2 (Represent) without proliferating stages.
STAGE_NOTES: dict[str, str] = {
    "S2A-CNN": "Vision / Convolutions & pooling (CNN) - sous-état conceptuel de Stage 2 (Represent)",
    "S2A-Seq": (
        "Séquences / NLP & Séries temporelles (Tokenize, Vocab, Embedding, LSTM, GRU) - "
        "sous-état conceptuel de Stage 2 (Represent)"
    ),
}

S2A_CNN_BLOCKS: set[str] = {
    "conv1d_layer",
    "conv2d_layer",
    "conv3d_layer",
    "conv_transpose2d_layer",
    "maxpool2d_layer",
    "avgpool2d",
    "adaptive_avgpool2d",
    "adaptive_maxpool2d",
    "upsample",
}

S2A_SEQ_BLOCKS: set[str] = {
    "tokenize",
    "build_vocab",
    "encode_text",
    "embedding",
    "rnn",
    "lstm",
    "gru",
    "rnn_layer",
    "multihead_attention",
    "sequence_dataset",
}


def stage_of_category(category_name: str) -> Stage:
    """Map category folder or category name to its Stage."""
    cat = category_name.split("-")[0].strip().lower()
    return STAGE_OF_CATEGORY.get(cat, Stage.PREPARE)


def stage_of_family(family: str) -> Stage:
    """Map a type family to its Stage."""
    f = family.strip().lower()
    return STAGE_OF_FAMILY.get(f, Stage.PREPARE)


def stage_of_block(block_name: str, category: str | None = None) -> Stage:
    """Map a block name (and optional category) to its Stage."""
    from mlblock.core.adapters import resolve_alias

    canonical = resolve_alias(block_name)
    if canonical in STAGE_OF_BLOCK_OVERRIDES:
        return STAGE_OF_BLOCK_OVERRIDES[canonical]

    if category:
        return stage_of_category(category)

    try:
        from mlblock.catalog import catalog

        block = catalog.get(canonical)
        if block is not None:
            cat = getattr(block.category, "name", None) or str(block.category)
            return stage_of_category(cat)
    except Exception:
        pass

    return Stage.PREPARE


def get_s2a_substate(block_name: str) -> str | None:
    """Return 'S2A-CNN' or 'S2A-Seq' if block belongs to S2A sub-states, else None."""
    from mlblock.core.adapters import resolve_alias

    canonical = resolve_alias(block_name)
    if canonical in S2A_CNN_BLOCKS:
        return "S2A-CNN"
    if canonical in S2A_SEQ_BLOCKS:
        return "S2A-Seq"
    return None
