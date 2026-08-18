import io


def plot_predictions(in_1: "object", in_2: "pd.DataFrame", target_column: "str") -> "bytes":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Tracer les prédictions.
    Trace les prédictions vs les valeurs réelles et retourne le PNG (octets).

    Args:
        in_1: Trained model.
        in_2: Test data.
        target_column: Target column name.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    X = in_2.drop(columns=[target_column])
    y_true = in_2[target_column]
    y_pred = in_1.predict(X)
    plt.figure(figsize=(10, 6))
    plt.scatter(y_true, y_pred, alpha=0.5)
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], "r--")
    plt.xlabel("Actual")
    plt.ylabel("Predicted")
    plt.title("Predictions vs Actual")
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    plt.close()
    return buf.getvalue()
