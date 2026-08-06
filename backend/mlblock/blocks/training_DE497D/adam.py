import torch


def adam(in_1: "torch.nn.Module", lr: "float" = 0.001, weight_decay: "float" = 0.0) -> "torch.optim.Adam":
    """Optimiseur Adam.
    
    Args:
        in_1: Model to optimize.
        lr: Taux d'apprentissage. (entre: 0.0001-1) (suggestions: 0.0001|0.001|0.01)
        weight_decay: Décroissance de poids. (entre: 0-1)
    """
    return torch.optim.Adam(in_1.parameters(), lr=lr, weight_decay=weight_decay)
