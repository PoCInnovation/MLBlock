import torch


def mse_loss() -> "torch.nn.MSELoss":
    """Mean squared error loss."""
    return torch.nn.MSELoss()
