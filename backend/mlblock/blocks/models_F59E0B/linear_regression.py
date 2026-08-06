def linear_regression(train_data: "pd.DataFrame", target_column: "str", fit_intercept: "bool" = True) -> "Model":
    """Régression linéaire.
    Régression linéaire sur un DataFrame.

    Args:
        train_data: Données d'entraînement.
        target_column: Colonne cible.
        fit_intercept: Ajuster l'ordonnée à l'origine.
    """
    from sklearn.linear_model import LinearRegression
    X = train_data.drop(columns=[target_column])
    y = train_data[target_column]
    return LinearRegression(fit_intercept=fit_intercept).fit(X, y)
