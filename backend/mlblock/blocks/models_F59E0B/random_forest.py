def random_forest(train_data: "pd.DataFrame", target_column: "str", n_estimators: "int" = 100, max_depth: "int" = None) -> "Model":
    """Forêt aléatoire.

    Args:
        train_data: Données d'entraînement.
        target_column: Colonne cible.
        n_estimators: Nombre d'arbres. (entre: 10-1000) (suggestions: 50|100|200|500)
        max_depth: Profondeur max. (entre: 1-100)
    """
    from sklearn.ensemble import RandomForestClassifier
    X = train_data.drop(columns=[target_column])
    y = train_data[target_column]
    return RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth).fit(X, y)
