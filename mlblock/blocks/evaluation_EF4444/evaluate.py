def evaluate(model: "Model", test_data: "pd.DataFrame", target_column: "str", method: "str" = 'mse', plot: "bool" = False) -> "float":
    """Évaluer le modèle.
    
    Args:
        model: Input tensor.
        test_data: Input tensor.
        target_column: Parameter.
        method: Parameter.
        plot: Parameter.
    """
    import numpy as np
    predictions = model.predict(test_data)
    accuracy = np.mean(predictions == test_target)
    return accuracy
