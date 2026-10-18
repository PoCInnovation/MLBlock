from __future__ import annotations

from typing import Literal


def ml_pipeline(
    in_1: "pd.DataFrame",  # noqa: F821
    scaler: Literal["standard", "minmax", "none"] = "standard",
    pca_components: "int" = 0,
    estimator: Literal["logistic_regression", "random_forest", "linear_regression", "kmeans"] = "logistic_regression",
    target_column: "str" = "target",
) -> tuple["Model", "numpy.ndarray"]:  # noqa: F821
    """Pipeline ML Tabulaire (MLPipeline)
    Pipeline Scikit-Learn complet enchaînant normalisation, PCA et modèle estimateur.

    Args:
        in_1: Données tabulaires d'entrée (pd.DataFrame).
        scaler: Type de normalisation tabulaire. (choix: standard|minmax|none)
        pca_components: Réduction de dimension PCA (0 pour désactiver). (entre: 0-50, pas: 1)
        estimator: Algorithme d'apprentissage automatique. (choix: logistic_regression|random_forest|linear_regression|kmeans)
        target_column: Colonne cible pour l'apprentissage supervisé.
    """
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LinearRegression, LogisticRegression
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import MinMaxScaler, StandardScaler

    steps = []

    if scaler == "standard":
        steps.append(("scaler", StandardScaler()))
    elif scaler == "minmax":
        steps.append(("scaler", MinMaxScaler()))

    if pca_components > 0:
        steps.append(("pca", PCA(n_components=pca_components)))

    if estimator == "linear_regression":
        model_cls = LinearRegression()
    elif estimator == "random_forest":
        model_cls = RandomForestClassifier()
    elif estimator == "kmeans":
        model_cls = KMeans(n_clusters=3, n_init=10)
    else:
        model_cls = LogisticRegression()

    steps.append(("estimator", model_cls))
    pipe = Pipeline(steps)

    if target_column in in_1.columns and estimator != "kmeans":
        X = in_1.drop(columns=[target_column])
        y = in_1[target_column]
        pipe.fit(X, y)
        preds = pipe.predict(X)
    else:
        X = in_1
        pipe.fit(X)
        preds = pipe.predict(X) if hasattr(pipe, "predict") else pipe.transform(X)

    return pipe, preds
