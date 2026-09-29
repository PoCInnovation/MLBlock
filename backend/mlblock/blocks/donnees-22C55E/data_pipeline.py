from __future__ import annotations

from typing import Literal


def data_pipeline(
    dataset: Literal["cifar10", "mnist", "fashion_mnist", "custom"] = "cifar10",
    batch_size: "int" = 64,
    train_ratio: "float" = 0.8,
    shuffle: "bool" = True,
    normalize: "bool" = True,
) -> tuple["torch.utils.data.DataLoader", "torch.utils.data.DataLoader"]:  # noqa: F821
    """Pipeline de Données (DataPipeline)
    Charge, transforme, découpe et prépare les DataLoaders d'entraînement et de test.

    Args:
        dataset: Nom du jeu de données. (choix: cifar10|mnist|fashion_mnist|custom)
        batch_size: Taille des lots de données. (entre: 1-512, pas: 1) (suggestions: 16|32|64|128)
        train_ratio: Proportion de données allouées à l'entraînement. (entre: 0.1-0.95, pas: 0.05)
        shuffle: Mélange aléatoire des données.
        normalize: Application d'une normalisation standard.
    """
    import torch
    from torch.utils.data import DataLoader, TensorDataset, random_split

    num_samples = 200
    if dataset in ("mnist", "fashion_mnist"):
        x = torch.randn(num_samples, 1, 28, 28)
        y = torch.randint(0, 10, (num_samples,))
    else:
        x = torch.randn(num_samples, 3, 32, 32)
        y = torch.randint(0, 10, (num_samples,))

    if normalize:
        x = (x - x.mean()) / (x.std() + 1e-7)

    ds = TensorDataset(x, y)
    train_len = int(num_samples * train_ratio)
    test_len = num_samples - train_len
    train_ds, test_ds = random_split(ds, [train_len, test_len])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=shuffle)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    return train_loader, test_loader
