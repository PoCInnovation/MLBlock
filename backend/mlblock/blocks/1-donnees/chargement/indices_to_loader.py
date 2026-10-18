def indices_to_loader(in_1: "numpy.ndarray", labels: "numpy.ndarray" = None, batch_size: "int" = 32, shuffle: "bool" = True) -> "torch.utils.data.DataLoader":  # noqa: F821
    """Indices to Loader.
    Convertit des indices encodés (int64) en DataLoader (embedding-ready).

    Args:
        in_1: Indices encodés (N,) ou (N, seq).
        labels: Labels (optionnel, zéros par défaut).
        batch_size: Taille des lots. (suggestions: 16|32|64|128)
        shuffle: Mélanger les lots.
    """
    import numpy as np
    import torch
    from torch.utils.data import DataLoader, TensorDataset

    x = torch.from_numpy(np.asarray(in_1).astype("int64"))
    if labels is None:
        y = torch.zeros(x.shape[0], dtype=torch.long)
    else:
        y = torch.from_numpy(np.asarray(labels).astype("int64"))
    return DataLoader(TensorDataset(x, y), batch_size=batch_size, shuffle=shuffle)
