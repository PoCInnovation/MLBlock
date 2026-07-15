def linear_regression(train_data: "pd.DataFrame", target_column: "str", fit_intercept: "bool" = True) -> "Model":
    """Régression linéaire.
    
    Args:
        train_data: Input tensor.
        target_column: Parameter.
        fit_intercept: Parameter.
    """
    from sklearn.linear_model import LinearRegression
    return LinearRegression().fit(train_data, train_target)
