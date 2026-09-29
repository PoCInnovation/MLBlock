def df_to_loader(in_1: "pd.DataFrame", target_column: "str" = "target", batch_size: "int" = 32, shuffle: "bool" = True) -> "torch.utils.data.DataLoader":  # noqa: F821
    """DataFrame to Loader.
    Convertit un DataFrame en DataLoader (features float32, labels long).

    Args:
        in_1: DataFrame avec colonne cible.
        target_column: Colonne cible (labels).
        batch_size: Taille des lots. (suggestions: 16|32|64|128)
        shuffle: Mélanger les lots.
    """
    import torch
    from torch.utils.data import DataLoader, TensorDataset

    X = in_1.drop(columns=[target_column]).values.astype("float32")
    y = in_1[target_column].values
    ds = TensorDataset(torch.from_numpy(X), torch.from_numpy(y).long())
    return DataLoader(ds, batch_size=batch_size, shuffle=shuffle)
