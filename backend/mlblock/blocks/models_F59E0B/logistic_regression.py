def logistic_regression(train_data: "pd.DataFrame", target_column: "str", max_iter: "int" = 1000) -> "Model":
    """Régression logistique.
    
    Args:
        train_data: Input tensor.
        target_column: Parameter.
        max_iter: Parameter.
    """
    from sklearn.linear_model import LogisticRegression
    return LogisticRegression().fit(train_data, train_target)
