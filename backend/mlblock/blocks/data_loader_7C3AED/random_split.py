import torch


def random_split(in_1: "torch.utils.data.Dataset", train_ratio: "float" = 0.8) -> "tuple[torch.utils.data.Dataset, torch.utils.data.Dataset]":
    """Random split dataset.

    Args:
        in_1: Dataset.
        train_ratio: Ratio d'entraînement. (entre: 0.1-0.9, pas: 0.05)
    """
    total = len(in_1)
    train_size = int(total * train_ratio)
    test_size = total - train_size
    train, test = torch.utils.data.random_split(in_1, [train_size, test_size])
    return train, test
