def knn(in_1: "pd.DataFrame", target_column: "str", task: "str" = "classification", n_neighbors: "int" = 5) -> "object":
    """K-nearest neighbors.
    
    Args:
        in_1: Training data.
        target_column: Target column name.
        task: Task type.
        n_neighbors: Number of neighbors.
    """
    from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
    X = in_1.drop(columns=[target_column])
    y = in_1[target_column]
    if task == "classification":
        model = KNeighborsClassifier(n_neighbors=n_neighbors)
    else:
        model = KNeighborsRegressor(n_neighbors=n_neighbors)
    model.fit(X, y)
    return model
