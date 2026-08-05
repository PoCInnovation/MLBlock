import torch


def sgd(in_1: "torch.nn.Module", lr: "float" = 0.01, momentum: "float" = 0.0, weight_decay: "float" = 0.0, nesterov: "bool" = False) -> "torch.optim.SGD":
    """SGD optimizer.
    
    Args:
        in_1: Model to optimize.
        lr: Learning rate.
        momentum: Momentum.
        weight_decay: Weight decay.
        nesterov: Nesterov momentum.
    """
    return torch.optim.SGD(in_1.parameters(), lr=lr, momentum=momentum, weight_decay=weight_decay, nesterov=nesterov)
