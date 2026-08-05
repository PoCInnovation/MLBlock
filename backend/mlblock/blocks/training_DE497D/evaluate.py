def evaluate(model: "Model", test_data: "pd.DataFrame", target_column: "str", method: "str" = 'mse', plot: "bool" = False) -> "float":
    """Évaluer le modèle.

    Args:
        model: Modèle entraîné.
        test_data: Données de test.
        target_column: Colonne cible.
        method: Métrique ('mse' ou 'accuracy').
        plot: Générer un graphique.
    """
    import numpy as np
    X = test_data.drop(columns=[target_column])
    y_true = test_data[target_column]
    predictions = model.predict(X)
    if method == "mse":
        return float(np.mean((predictions - y_true) ** 2))
    return float(np.mean(predictions == y_true))
