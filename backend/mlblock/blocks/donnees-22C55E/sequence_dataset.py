def sequence_dataset(in_1: "pd.DataFrame | numpy.ndarray", seq_len: "int" = 10, target_column: "str" = "") -> "torch.utils.data.DataLoader":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Créer des fenêtres de séquence.
    Découpe une série en fenêtres glissantes (X = seq_len pas, y = la valeur
    suivante) pour RNN / time series. Avec target_column, y est la valeur
    suivante de cette colonne (sinon la ligne complète).

    Args:
        in_1: Série (DataFrame ou ndarray).
        seq_len: Longueur des fenêtres (entre: 2-50, pas: 1).
        target_column: Colonne cible (vide = la série entière).
    """
    import numpy as np
    import torch
    from torch.utils.data import DataLoader, TensorDataset

    if hasattr(in_1, "values"):
        data = in_1.values.astype(np.float32)
    else:
        data = np.asarray(in_1, dtype=np.float32)
    if len(data.shape) == 1:
        data = data.reshape(-1, 1)

    target_idx = None
    if target_column:
        target_idx = list(in_1.columns).index(target_column) if hasattr(in_1, "columns") else None
        if target_idx is None:
            raise ValueError(f"Colonne cible introuvable : {target_column}")

    xs, ys = [], []
    for i in range(len(data) - seq_len):
        xs.append(data[i:i + seq_len])
        y = data[i + seq_len]
        ys.append([y[target_idx]] if target_idx is not None else y)
    X = torch.tensor(np.array(xs))
    y = torch.tensor(np.array(ys))
    return DataLoader(TensorDataset(X, y), batch_size=32, shuffle=False)
