import torch


def sgd(in_1: "torch.nn.Module", lr: "float" = 0.01, momentum: "float" = 0.0, weight_decay: "float" = 0.0, nesterov: "bool" = False) -> "torch.optim.SGD":
    """Descente de gradient stochastique.
    
    Args:
        in_1: Model to optimize.
        lr: Taux d'apprentissage. (entre: 0.0001-1) (suggestions: 0.001|0.01|0.1)
        momentum: Momentum. (entre: 0-1)
        weight_decay: Décroissance de poids. (entre: 0-1)
        nesterov: Nesterov momentum.
    """
    return torch.optim.SGD(in_1.parameters(), lr=lr, momentum=momentum, weight_decay=weight_decay, nesterov=nesterov)
