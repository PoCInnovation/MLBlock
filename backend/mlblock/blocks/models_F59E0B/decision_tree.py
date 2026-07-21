from typing import Literal


def decision_tree(in_1: "pd.DataFrame", target_column: "str", task: Literal["classification", "regression"] = "classification", max_depth: "int | None" = None) -> "object":
    """Decision tree.
    
    Args:
        in_1: Training data.
        target_column: Target column name.
        task: Task type.
        max_depth: Maximum depth.
    """
    from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
    X = in_1.drop(columns=[target_column])
    y = in_1[target_column]
    if task == "classification":
        model = DecisionTreeClassifier(max_depth=max_depth)
    else:
        model = DecisionTreeRegressor(max_depth=max_depth)
    model.fit(X, y)
    return model
