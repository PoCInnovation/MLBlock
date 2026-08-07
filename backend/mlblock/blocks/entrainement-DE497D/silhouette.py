def silhouette(model: "Model", in_1: "pd.DataFrame") -> "float":
    """Score de silhouette.
    Évalue la qualité du clustering du modèle sur les données.

    Args:
        model: Modèle de clustering (k-means).
        in_1: Données d'entraînement.
    """
    from sklearn.metrics import silhouette_score

    labels = model.predict(in_1)
    return float(silhouette_score(in_1, labels))
