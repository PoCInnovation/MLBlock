import torch


def adam(in_1: "torch.nn.Module", lr: "float" = 0.001, weight_decay: "float" = 0.0) -> "torch.optim.Adam":
    """Adam optimizer.
    
    Args:
        in_1: Model to optimize.
        lr: Learning rate.
        weight_decay: Weight decay.
    """
    return torch.optim.Adam(in_1.parameters(), lr=lr, weight_decay=weight_decay)
