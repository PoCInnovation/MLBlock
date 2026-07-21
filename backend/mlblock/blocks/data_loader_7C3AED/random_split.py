import torch


def random_split(in_1: "torch.utils.data.Dataset", train_ratio: "float" = 0.8) -> "dict":
    """Random split dataset.
    
    Args:
        in_1: Dataset.
        train_ratio: Ratio of training data.
    """
    total = len(in_1)
    train_size = int(total * train_ratio)
    test_size = total - train_size
    train, test = torch.utils.data.random_split(in_1, [train_size, test_size])
    return {"train": train, "test": test}
