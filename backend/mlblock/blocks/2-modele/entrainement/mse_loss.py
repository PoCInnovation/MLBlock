import torch

def mse_loss() -> "torch.nn.MSELoss":
    """Mean Squared Error Loss.
    Perte quadratique moyenne (régression).
    
    Exemple: mse_loss()
    """
    return torch.nn.MSELoss()
