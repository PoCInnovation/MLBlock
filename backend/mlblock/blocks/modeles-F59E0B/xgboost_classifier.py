def xgboost_classifier(train_data: "pd.DataFrame", target_column: "str", n_estimators: "int" = 100, max_depth: "int" = 6, learning_rate: "float" = 0.1) -> "Model":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """XGBoost Classifier.
    Modèle de boosting rapide pour la classification tabulaire.

    Args:
        train_data: Données d'entraînement.
        target_column: Colonne cible.
        n_estimators: Nombre d'arbres. (entre: 10-1000) (suggestions: 50|100|200|500)
        max_depth: Profondeur max. (entre: 1-20) (suggestions: 3|6|10)
        learning_rate: Taux d'apprentissage. (entre: 0.01-1, pas: 0.01) (suggestions: 0.01|0.05|0.1|0.3)
    """
    from xgboost import XGBClassifier
    X = train_data.drop(columns=[target_column])
    y = train_data[target_column]
    return XGBClassifier(n_estimators=n_estimators, max_depth=max_depth, learning_rate=learning_rate).fit(X, y)
