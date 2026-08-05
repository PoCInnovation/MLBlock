import matplotlib.pyplot as plt


def plot_predictions(in_1: "object", in_2: "pd.DataFrame", target_column: "str", output_path: "str" = "predictions.png") -> "None":
    """Plot predictions.
    
    Args:
        in_1: Trained model.
        in_2: Test data.
        target_column: Target column name.
        output_path: Output file path.
    """
    X = in_2.drop(columns=[target_column])
    y_true = in_2[target_column]
    y_pred = in_1.predict(X)
    plt.figure(figsize=(10, 6))
    plt.scatter(y_true, y_pred, alpha=0.5)
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], "r--")
    plt.xlabel("Actual")
    plt.ylabel("Predicted")
    plt.title("Predictions vs Actual")
    plt.savefig(output_path)
    plt.close()
