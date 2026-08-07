def sequence_dataset(in_1: "pd.DataFrame | numpy.ndarray", seq_len: "int" = 10, target_column: "str" = "") -> "torch.utils.data.DataLoader":
    """Créer des fenêtres de séquence.
    Découpe une série en fenêtres glissantes (X = seq_len valeurs, y = la
    suivante) pour RNN / time series.

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

    xs, ys = [], []
    for i in range(len(data) - seq_len):
        xs.append(data[i:i + seq_len])
        ys.append(data[i + seq_len])
    X = torch.tensor(np.array(xs))
    y = torch.tensor(np.array(ys))
    return DataLoader(TensorDataset(X, y), batch_size=32, shuffle=False)
