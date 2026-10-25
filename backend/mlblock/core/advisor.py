"""Moteur heuristique d'analyse et de scoring pédagogique d'un pipeline (Gamification IA).

Évalue la qualité et l'intelligence de l'assemblage :
- Normalisation et prétraitement
- Séparation des jeux de données
- Cohérence architecturale (non-linéarités, activations)
- Calibration des hyperparamètres (learning rate, époques)
- Présence et branchement d'un bloc d'évaluation / résultats
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

EVAL_BLOCKS = {
    "evaluate",
    "confusion_matrix",
    "silhouette",
    "plot_predictions",
    "evaluate_agent",
    "deep_evaluator",
    "confusion_matrix_eval",
    "clustering_visualizer",
    "agent_rollout_viewer",
}

SCALER_BLOCKS = {
    "standard_scaler",
    "normalize",
    "tabular_data_pipeline",
}

DISTANCE_MODELS = {
    "knn",
    "svm",
    "kmeans",
    "logistic_regression",
    "pca",
}

ACTIVATION_BLOCKS = {
    "relu_layer",
    "softmax",
    "sigmoid",
    "tanh",
    "gelu",
    "leaky_relu",
    "elu",
    "selu",
    "prelu",
    "silu",
}

SPLIT_BLOCKS = {
    "train_test_split",
    "data_loader",
    "random_split",
    "torch_data_pipeline",
}

REGULARIZATION_BLOCKS = {
    "dropout_layer",
    "batchnorm2d",
    "batchnorm1d",
    "layernorm",
}


@dataclass
class PipelineFeedback:
    score: int
    level: str
    summary: str
    strengths: list[str] = field(default_factory=list)
    improvements: list[str] = field(default_factory=list)
    tips: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "score": self.score,
            "level": self.level,
            "summary": self.summary,
            "strengths": self.strengths,
            "improvements": self.improvements,
            "tips": self.tips,
        }


def analyze_pipeline(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> PipelineFeedback:
    """Analyse un pipeline DAG et retourne une note /100 et des conseils d'amélioration."""
    if not nodes:
        return PipelineFeedback(
            score=0,
            level="Vide",
            summary="Le pipeline est vide. Dépose des blocs sur le canvas pour commencer.",
            tips=["Commence par charger des données (ex: load_csv ou load_torch_dataset)."],
        )

    # Extraction des types présents (racines et enfants éventuels de superblocks)
    node_types: set[str] = set()
    node_by_id: dict[str, dict[str, Any]] = {}
    for n in nodes:
        ntype = str(n.get("type", ""))
        node_types.add(ntype)
        node_by_id[str(n.get("id", ""))] = n
        for c in n.get("children", []) or []:
            if isinstance(c, dict):
                node_types.add(str(c.get("type", "")))
            elif isinstance(c, str):
                node_types.add(c)

    score = 25  # Base de départ
    strengths: list[str] = []
    improvements: list[str] = []
    tips: list[str] = []

    # 1. RÈGLE EVALUATION (Gamification principale)
    has_eval = bool(node_types & EVAL_BLOCKS)
    if has_eval:
        score += 25
        strengths.append(
            "Évaluation connectée : les métriques et performances du modèle sont mesurées en sortie."
        )
    else:
        improvements.append(
            "Aucun bloc d'évaluation en sortie : ajoute evaluate, confusion_matrix ou plot_predictions."
        )
        tips.append("Une pipeline sans évaluation ne permet pas de prouver sa généralisation.")
    # 2. RÈGLE PRETRAITEMENT / NORMALISATION
    has_distance_model = bool(node_types & DISTANCE_MODELS)
    has_scaler = bool(node_types & SCALER_BLOCKS)
    if has_distance_model:
        if has_scaler:
            score += 20
            strengths.append(
                "Données standardisées : tes features sont centrées/réduites, idéal pour cet algorithme."
            )
        else:
            score -= 10
            improvements.append(
                "Normalisation absente : ton modèle est sensible aux échelles. Ajoute standard_scaler en amont."
            )
    # 3. RÈGLE SEPARATION DES DONNEES (Train/Test)
    has_split = bool(node_types & SPLIT_BLOCKS)
    if has_split:
        score += 15
        strengths.append("Séparation des données : présence d'un découpage pour valider sur des données indépendantes.")
    else:
        improvements.append(
            "Pas de découpage train/test : risque de surapprentissage sans mesure d'erreur indépendante."
        )
        tips.append("Utilise train_test_split pour réserver 20% à 30% des données pour le test.")
    # 4. RÈGLE ARCHITECTURE RÉSEAU DE NEURONES
    linear_count = sum(1 for n in nodes if n.get("type") == "linear_layer")
    has_activation = bool(node_types & ACTIVATION_BLOCKS)
    if linear_count >= 2:
        if has_activation:
            score += 15
            strengths.append(
                "Non-linéarité activée : tes couches sont séparées par des activations "
                "pour apprendre des motifs complexes."
            )
        else:
            score -= 15
            improvements.append(
                "Empilement linéaire : sans fonction d'activation (ex: relu_layer), "
                "le réseau équivaut à une régression linéaire."
            )
    # 5. REGULARISATION
    has_regularization = bool(node_types & REGULARIZATION_BLOCKS)
    if has_regularization:
        score += 10
        strengths.append(
            "Régularisation active : présence de dropout ou batchnorm pour stabiliser et prévenir le surapprentissage."
        )
    # 6. VERIFICATION DES HYPERPARAMETRES (Learning rate / Epochs)
    for n in nodes:
        ntype = str(n.get("type", ""))
        params = n.get("params", {}) or {}
        if ntype in {"adam", "adamw"}:
            lr_val = params.get("lr")
            if lr_val is not None:
                try:
                    lr_float = float(lr_val)
                    if lr_float > 0.05:
                        improvements.append(
                            f"Learning rate ({lr_float}) très élevé pour Adam : privilégie 0.001 à 0.0001."
                        )
                    elif 0.0001 <= lr_float <= 0.01:
                        score += 5
                        strengths.append("Taux d'apprentissage Adam bien calibré.")
                except (ValueError, TypeError):
                    pass
        if ntype in {"train_model", "deep_trainer"}:
            epochs_val = params.get("epochs")
            if epochs_val is not None:
                try:
                    ep = int(epochs_val)
                    if ep <= 1:
                        tips.append(
                            "1 seule époque d'entraînement : augmente à 5–20 époques pour permettre de converger."
                        )
                    elif ep >= 5:
                        score += 5
                except (ValueError, TypeError):
                    pass

    # Délimitation du score
    final_score = max(10, min(100, score))

    if final_score >= 80:
        level = "Expert 🏆"
        summary = "Architecture robuste et rigoureuse respectant les meilleures pratiques de machine learning."
    elif final_score >= 60:
        level = "Avancé 🚀"
        summary = (
            "Bonne structure globale. Quelques étapes complémentaires permettraient d'optimiser le pipeline."
        )
    elif final_score >= 40:
        level = "Intermédiaire 📈"
        summary = (
            "Le pipeline fonctionne mais manque d'étapes clés (normalisation, validation indépendante ou activations)."
        )
    else:
        level = "Apprenti 🌱"
        summary = "Pipeline basique. Branche une évaluation et prétraite tes données pour fiabiliser l'apprentissage."
    return PipelineFeedback(
        score=final_score,
        level=level,
        summary=summary,
        strengths=strengths,
        improvements=improvements,
        tips=tips,
    )
