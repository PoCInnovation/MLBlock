def kmeans(in_1: "pd.DataFrame", n_clusters: "int" = 3) -> "Model":
    """Regrouper en clusters.
    Applique le clustering K-means sur les données.

    Args:
        in_1: Données d'entraînement.
        n_clusters: Nombre de clusters (entre: 2-10, pas: 1).
    """
    from sklearn.cluster import KMeans

    model = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    model.fit(in_1)
    return model
