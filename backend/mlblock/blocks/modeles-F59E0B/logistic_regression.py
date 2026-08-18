def logistic_regression(train_data: "pd.DataFrame", target_column: "str", max_iter: "int" = 1000) -> "Model":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Régression logistique.
    Régression logistique (classification binaire).

    Args:
        train_data: Données d'entraînement.
        target_column: Colonne cible.
        max_iter: Itérations. (entre: 100-10000)
    """
    from sklearn.linear_model import LogisticRegression
    X = train_data.drop(columns=[target_column])
    y = train_data[target_column]
    return LogisticRegression(max_iter=max_iter).fit(X, y)
