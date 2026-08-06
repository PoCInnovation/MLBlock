import torch


def step_lr(in_1: "torch.optim.Optimizer", step_size: "int" = 30, gamma: "float" = 0.1) -> "torch.optim.lr_scheduler.StepLR":
    """Step LR scheduler.
    
    Args:
        in_1: Optimizer.
        step_size: Période. (entre: 1-1000)
        gamma: Facteur de décroissance. (entre: 0-1)
    """
    return torch.optim.lr_scheduler.StepLR(in_1, step_size=step_size, gamma=gamma)
