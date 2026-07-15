def random_forest(train_data: "pd.DataFrame", target_column: "str", n_estimators: "int" = 100, max_depth: "int" = None) -> "Model":
    """Random Forest.
    
    Args:
        train_data: Input tensor.
        target_column: Parameter.
        n_estimators: Parameter.
        max_depth: Parameter.
    """
    from sklearn.ensemble import RandomForestClassifier
    return RandomForestClassifier(n_estimators=n_estimators).fit(train_data, train_target)
