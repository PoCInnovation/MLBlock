from typing import Literal


def knn(in_1: "pd.DataFrame", target_column: "str", task: Literal["classification", "regression"] = "classification", n_neighbors: "int" = 5) -> "object":
    """K plus proches voisins.
    K plus proches voisins (classification ou régression).
    
    Args:
        in_1: Training data.
        target_column: Target column name.
        task: Task type.
        n_neighbors: Nombre de voisins. (entre: 1-100) (suggestions: 3|5|10|20)
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
