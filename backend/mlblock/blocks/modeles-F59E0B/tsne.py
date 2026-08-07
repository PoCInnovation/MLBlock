import numpy as np


def tsne(in_1: "pd.DataFrame", n_components: "int" = 2) -> "numpy.ndarray":
    """Réduire en 2D (t-SNE).
    Projette les données en 2 ou 3 dimensions pour visualisation.

    Args:
        in_1: Données d'entraînement.
        n_components: Dimensions de sortie (entre: 2-3, pas: 1).
    """
    from sklearn.manifold import TSNE

    return TSNE(n_components=n_components, random_state=42).fit_transform(in_1)
