import torch

def mse_loss() -> "torch.nn.MSELoss":
    """Perte quadratique moyenne.
    Perte quadratique moyenne (régression).
    """
    return torch.nn.MSELoss()
