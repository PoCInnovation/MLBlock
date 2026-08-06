import torch


def data_loader(in_1: "torch.utils.data.Dataset", batch_size: "int" = 32, shuffle: "bool" = True, num_workers: "int" = 0) -> "torch.utils.data.DataLoader":
    """Chargeur de données.
    
    Args:
        in_1: Dataset.
        batch_size: Batch size. (suggestions: 16|32|64|128)
        shuffle: Whether to shuffle.
        num_workers: Number of workers.
    """
    return torch.utils.data.DataLoader(in_1, batch_size=batch_size, shuffle=shuffle, num_workers=num_workers)
