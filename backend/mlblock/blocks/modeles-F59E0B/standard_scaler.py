def standard_scaler(in_1: "pd.DataFrame", target_column: "str | None" = None) -> "dict[scaler: object, scaled: numpy.ndarray]":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Mise à l'échelle standard.
    Standardise les features (moyenne 0, écart-type 1).
    
    Args:
        in_1: Input data.
        target_column: Target column to exclude.
    """
    from sklearn.preprocessing import StandardScaler
    if target_column and target_column in in_1.columns:
        X = in_1.drop(columns=[target_column])
    else:
        X = in_1
    scaler = StandardScaler()
    scaled = scaler.fit_transform(X)
    return {"scaler": scaler, "scaled": scaled}
