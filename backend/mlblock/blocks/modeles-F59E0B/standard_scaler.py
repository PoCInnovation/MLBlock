def standard_scaler(in_1: "pd.DataFrame", target_column: "str | None" = None) -> "pd.DataFrame":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Standard Scaler.
    Standardise les features (moyenne 0, écart-type 1).

    Args:
        in_1: Input data.
        target_column: Target column to exclude.
    """
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    if target_column and target_column in in_1.columns:
        X = in_1.drop(columns=[target_column])
    else:
        X = in_1
        target_column = None
    scaler = StandardScaler()
    scaled = scaler.fit_transform(X)
    out = pd.DataFrame(scaled, columns=X.columns, index=in_1.index)
    if target_column:
        out[target_column] = in_1[target_column].values
    return out
