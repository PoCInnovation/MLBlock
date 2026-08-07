import numpy as np


def confusion_matrix(model: "Model", test_data: "pd.DataFrame", target_column: "str") -> "numpy.ndarray":
    """Matrice de confusion.
    Compare les prédictions aux valeurs réelles (classification).

    Args:
        model: Modèle entraîné.
        test_data: Données de test.
        target_column: Colonne cible.
    """
    from sklearn.metrics import confusion_matrix as cm

    X = test_data.drop(columns=[target_column])
    y_true = test_data[target_column]
    y_pred = model.predict(X)
    return np.array(cm(y_true, y_pred))
