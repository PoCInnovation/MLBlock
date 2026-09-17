from __future__ import annotations

import io


def tsne(
    in_1: "pd.DataFrame",  # noqa: F821
    model: "Model" = None,  # noqa: F821
    target_column: "str | None" = None,
    n_components: "int" = 2,
    perplexity: "float" = 30.0,
) -> "bytes":  # noqa: F821
    """t-SNE Projection.
    Projette les données en 2D avec t-SNE et génère un graphique PNG des clusters.

    Args:
        in_1: Données à projeter.
        model: Modèle de clustering pour colorer les points (optionnel).
        target_column: Colonne cible pour la coloration (optionnelle).
        n_components: Dimensions de sortie (2 par défaut). (entre: 2-3, pas: 1)
        perplexity: Perplexité pour le manifold. (entre: 5-50, pas: 5)
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from sklearn.manifold import TSNE

    if target_column and target_column in in_1.columns:
        X = in_1.drop(columns=[target_column])
        labels = in_1[target_column]
    else:
        X = in_1
        labels = None

    if model is not None and hasattr(model, "predict"):
        try:
            labels = model.predict(X)
        except Exception:
            pass

    # Ensure numeric columns only for t-SNE
    X_num = X.select_dtypes(include=["number"])
    perpl = min(perplexity, max(1.0, float(len(X_num) - 1)))
    proj = TSNE(n_components=n_components, perplexity=perpl, random_state=42).fit_transform(X_num)

    plt.figure(figsize=(8, 6))
    if labels is not None:
        scatter = plt.scatter(proj[:, 0], proj[:, 1], c=labels, cmap="viridis", alpha=0.8, edgecolors="none")
        plt.colorbar(scatter, label="Clusters / Labels")
    else:
        plt.scatter(proj[:, 0], proj[:, 1], color="#6366F1", alpha=0.8, edgecolors="none")

    plt.title("t-SNE 2D Projection")
    plt.xlabel("Dimension 1")
    plt.ylabel("Dimension 2")
    plt.tight_layout()

    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=100)
    plt.close()
    return buf.getvalue()
