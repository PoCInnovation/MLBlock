import torch

def mse_loss() -> "torch.nn.MSELoss":
    """Mean Squared Error Loss.
    Perte quadratique moyenne (régression).
    """
    return torch.nn.MSELoss()
