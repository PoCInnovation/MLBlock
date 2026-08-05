def standard_scaler(in_1: "pd.DataFrame", target_column: "str | None" = None) -> "dict":
    """Standard scaler.
    
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
