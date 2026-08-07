from typing import Literal


def svm(in_1: "pd.DataFrame", target_column: "str", task: Literal["classification", "regression"] = "classification", kernel: Literal["rbf", "linear", "poly", "sigmoid"] = "rbf", C: "float" = 1.0) -> "object":
    """Machine à vecteurs de support.
    Machine à vecteurs de support (classification ou régression).
    
    Args:
        in_1: Training data.
        target_column: Target column name.
        task: Task type.
        kernel: Kernel type.
        C: Régularisation. (entre: 0.001-100)
    """
    from sklearn.svm import SVC, SVR
    X = in_1.drop(columns=[target_column])
    y = in_1[target_column]
    if task == "classification":
        model = SVC(kernel=kernel, C=C)
    else:
        model = SVR(kernel=kernel, C=C)
    model.fit(X, y)
    return model
