import torch


def cross_entropy_loss() -> "torch.nn.CrossEntropyLoss":
    """Cross-entropy loss."""
    return torch.nn.CrossEntropyLoss()
