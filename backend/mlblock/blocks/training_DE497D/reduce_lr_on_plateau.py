import torch


def reduce_lr_on_plateau(in_1: "torch.optim.Optimizer", mode: "str" = "min", factor: "float" = 0.1, patience: "int" = 10) -> "torch.optim.lr_scheduler.ReduceLROnPlateau":
    """Reduce LR on plateau scheduler.
    
    Args:
        in_1: Optimizer.
        mode: One of 'min' or 'max'.
        factor: Factor by which the learning rate will be reduced.
        patience: Number of epochs with no improvement after which learning rate will be reduced.
    """
    return torch.optim.lr_scheduler.ReduceLROnPlateau(in_1, mode=mode, factor=factor, patience=patience)
