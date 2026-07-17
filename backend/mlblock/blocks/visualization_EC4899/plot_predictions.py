def plot_predictions(model: "Model", test_data: "pd.DataFrame", target_column: "str", output_path: "str" = 'predictions.png') -> "Any":
    """Graphique prédictions vs réelles.
    
    Args:
        model: Input tensor.
        test_data: Input tensor.
        target_column: Parameter.
        output_path: Parameter.
    """
    import matplotlib.pyplot as plt
    plt.figure()
    plt.plot(targets, label='Target')
    plt.plot(predictions, label='Prediction')
    plt.legend()
    plt.savefig(path)
    plt.close()
