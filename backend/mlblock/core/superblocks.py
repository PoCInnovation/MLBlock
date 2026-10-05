"""Standard SuperBlocks — named container templates (three-stage-blocks).

Each definition carries its declared execution engine, its macro-stage and
its default children (plain simple blocks — the "sous-options" surfaced in
advanced mode). Registration injects them into BLOCK_REGISTRY so they
resolve, validate and generate exactly like any other block.

`deep_trainer` and `mlflow_tracker` are intentionally NOT defined here:
they already exist as real flat blocks. Their pedagogical titles live in
EXTRA_TITLES so the catalog still exposes all 15 standard titles.
"""
from __future__ import annotations

from typing import Any


def _child(block_type: str, **params: Any) -> dict[str, Any]:
    return {"type": block_type, "params": dict(params)}


SUPERBLOCK_DEFS: dict[str, dict[str, Any]] = {
    "tabular_data_pipeline": {
        "title": "Préparation Tabulaire (Scikit-Learn)",
        "description": "Charge un CSV puis standardise les features.",
        "macro_stage": 1,
        "engine": "sklearn",
        "stage": 0,
        "stage_name": "Ingest",
        "children": [_child("load_csv"), _child("standard_scaler")],
    },
    "torch_data_pipeline": {
        "title": "Chargement d'Images & Lots (PyTorch)",
        "description": "Charge un dataset d'images puis l'enveloppe en DataLoader.",
        "macro_stage": 1,
        "engine": "pytorch",
        "stage": 0,
        "stage_name": "Ingest",
        "children": [_child("load_torch_dataset"), _child("data_loader")],
    },
    "gym_env_pipeline": {
        "title": "Monde Virtuel & Simulation (Gymnasium)",
        "description": "Instancie un environnement Gymnasium.",
        "macro_stage": 1,
        "engine": "gym",
        "stage": 0,
        "stage_name": "Ingest",
        "children": [_child("create_env")],
    },
    "nlp_data_pipeline": {
        "title": "Préparation de Texte (PyTorch)",
        "description": "Découpe un texte en tokens puis construit le vocabulaire.",
        "macro_stage": 1,
        "engine": "pytorch",
        "stage": 0,
        "stage_name": "Ingest",
        "children": [_child("tokenize"), _child("build_vocab")],
    },
    "sequential_model": {
        "title": "Réseau de Neurones Séquentiel (PyTorch)",
        "description": "Conteneur vide à remplir de couches nn.Module.",
        "macro_stage": 2,
        "engine": "pytorch",
        "stage": 2,
        "stage_name": "Represent",
        "children": [],
        "inputs": [{"name": "in_1", "dtype": "torch.nn.Module"}],
        "outputs": [{"name": "out_1", "dtype": "torch.nn.Module"}],
    },
    "sklearn_model_trainer": {
        "title": "Modèle Statistique & Arbres (Scikit-Learn)",
        "description": "Entraîne un estimateur statistique sur données tabulaires.",
        "macro_stage": 2,
        "engine": "sklearn",
        "stage": 3,
        "stage_name": "Train",
        "children": [_child("logistic_regression")],
    },
    "xgboost_trainer": {
        "title": "Modèle de Boosting Rapide (XGBoost)",
        "description": "Entraîne un boosting XGBoost sur données tabulaires.",
        "macro_stage": 2,
        "engine": "sklearn",
        "stage": 3,
        "stage_name": "Train",
        "children": [_child("xgboost_classifier")],
    },
    "rl_agent_trainer": {
        "title": "Apprentissage par Renforcement (Gymnasium)",
        "description": "Entraîne une table Q sur un environnement discret.",
        "macro_stage": 2,
        "engine": "gym",
        "stage": 3,
        "stage_name": "Train",
        "children": [_child("q_learning")],
    },
    "deep_evaluator": {
        "title": "Score & Courbes d'Apprentissage (Plotly / PyTorch)",
        "description": "Trace prédictions vs valeurs réelles (PNG).",
        "macro_stage": 3,
        "engine": "pytorch",
        "stage": 4,
        "stage_name": "Eval",
        "children": [_child("plot_predictions")],
    },
    "confusion_matrix_eval": {
        "title": "Matrice de Confusion & Précision (Seaborn / Scikit-Learn)",
        "description": "Compare les prédictions aux valeurs réelles.",
        "macro_stage": 3,
        "engine": "sklearn",
        "stage": 4,
        "stage_name": "Eval",
        "children": [_child("confusion_matrix")],
    },
    "clustering_visualizer": {
        "title": "Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)",
        "description": "Regroupe les données en clusters K-means.",
        "macro_stage": 3,
        "engine": "sklearn",
        "stage": 4,
        "stage_name": "Eval",
        "children": [_child("kmeans")],
    },
    "agent_rollout_viewer": {
        "title": "Score & Démonstration de l'Agent (Gymnasium / Plotly)",
        "description": "Joue des épisodes et retourne la récompense moyenne.",
        "macro_stage": 3,
        "engine": "gym",
        "stage": 4,
        "stage_name": "Eval",
        "children": [_child("evaluate_agent")],
    },
}

# Real flat blocks that also carry a pedagogical SuperBlock title.
EXTRA_TITLES: list[tuple[str, str, int]] = [
    ("deep_trainer", "Entraînement de Réseau (PyTorch)", 2),
    ("mlflow_tracker", "Suivi & Historique d'Expérience (MLflow)", 2),
    ("mlflow_model_exporter", "Export de Modèle Prêt à l'Emploi (MLflow)", 3),
]


def _ports_of(spec: Any, direction: str) -> list[dict[str, str]]:
    if spec is None:
        return []
    ports = getattr(spec, direction, None)
    if ports is None and isinstance(spec, dict):
        ports = spec.get(direction, [])
    return [dict(p) for p in (ports or [])]


def register_superblocks() -> None:
    """Inject standard SuperBlock containers into the block registry."""
    from mlblock.blocks.registry import BLOCK_REGISTRY, BLOCK_SOURCES
    from mlblock.core.stages import MacroStage
    from mlblock.server.schemas import Block, Category

    for sb_id, d in SUPERBLOCK_DEFS.items():
        if sb_id in BLOCK_REGISTRY:
            continue
        child_specs = [BLOCK_REGISTRY.get(c["type"]) for c in d["children"]]
        if d.get("inputs") is not None:
            inputs = [dict(p) for p in d["inputs"]]
        elif child_specs:
            inputs = _ports_of(child_specs[0], "inputs")
        else:
            inputs = []
        if d.get("outputs") is not None:
            outputs = [dict(p) for p in d["outputs"]]
        elif child_specs:
            outputs = _ports_of(child_specs[-1], "outputs")
        else:
            outputs = []
        BLOCK_REGISTRY[sb_id] = Block(
            name=sb_id,
            description=f"{d['title']}.\n{d['description']}",
            category=Category(name="superblocks", color="#6366F1"),
            params={},
            inputs=inputs,
            outputs=outputs,
            advanced=False,
            group="core",
            stage=int(d["stage"]),
            stage_name=d["stage_name"],
            macro_stage=int(d["macro_stage"]),
            macro_stage_name=MacroStage(int(d["macro_stage"])).stage_name,
            engine=d["engine"],
            is_transition=False,
        )
        # Empty source: the generator expands containers from children,
        # it must not inline a (nonexistent) function body.
        BLOCK_SOURCES[sb_id] = ""
