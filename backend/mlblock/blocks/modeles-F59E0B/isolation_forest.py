def isolation_forest(in_1: "pd.DataFrame", contamination: "float" = 0.1) -> "Model":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Détecter les anomalies.
    Entraîne un Isolation Forest (isolation forest) sur les données.

    Args:
        in_1: Données d'entraînement.
        contamination: Proportion d'anomalies attendue (entre: 0.01-0.5, pas: 0.01).
    """
    from sklearn.ensemble import IsolationForest

    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(in_1)
    return model
