def pca(in_1: "pd.DataFrame", n_components: "int" = 2, target_column: "str | None" = None) -> "dict[model: Model, transformed: numpy.ndarray]":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Réduction de dimensionnalité PCA.
    Réduction de dimensionnalité par composantes principales.
    
    Args:
        in_1: Input data.
        n_components: Composantes. (entre: 1-100)
        target_column: Target column to exclude.
    """
    from sklearn.decomposition import PCA
    if target_column and target_column in in_1.columns:
        X = in_1.drop(columns=[target_column])
    else:
        X = in_1
    pca_model = PCA(n_components=n_components)
    transformed = pca_model.fit_transform(X)
    return {"model": pca_model, "transformed": transformed}
