import torch


def data_loader(in_1: "torch.utils.data.Dataset", batch_size: "int" = 32, shuffle: "bool" = True, num_workers: "int" = 0) -> "torch.utils.data.DataLoader":
    """Data loader.
    
    Args:
        in_1: Dataset.
        batch_size: Batch size.
        shuffle: Whether to shuffle.
        num_workers: Number of workers.
    """
    return torch.utils.data.DataLoader(in_1, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers)
