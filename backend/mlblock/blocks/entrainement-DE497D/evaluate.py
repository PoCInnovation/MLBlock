def evaluate(model: "Model", test_data: "pd.DataFrame", target_column: "str", method: "str" = 'mse', plot: "bool" = False) -> "float":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Évaluer le modèle.
    Évalue un modèle sur des données de test (mse, accuracy, f1, precision,
    recall).

    Args:
        model: Modèle entraîné.
        test_data: Données de test.
        target_column: Colonne cible.
        method: Métrique. (choix: mse|accuracy|f1|precision|recall)
        plot: Générer un graphique.
    """
    import numpy as np
    X = test_data.drop(columns=[target_column])
    y_true = test_data[target_column]
    predictions = model.predict(X)
    if method == "mse":
        return float(np.mean((predictions - y_true) ** 2))
    if method in ("f1", "precision", "recall"):
        from sklearn.metrics import f1_score, precision_score, recall_score

        fn = {"f1": f1_score, "precision": precision_score, "recall": recall_score}[method]
        return float(fn(y_true, predictions, average="weighted", zero_division=0))
    return float(np.mean(predictions == y_true))
