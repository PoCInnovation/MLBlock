import torch


def step_lr(in_1: "torch.optim.Optimizer", step_size: "int" = 30, gamma: "float" = 0.1) -> "torch.optim.lr_scheduler.StepLR":
    """Step LR scheduler.
    
    Args:
        in_1: Optimizer.
        step_size: Period of learning rate decay.
        gamma: Multiplicative factor of learning rate decay.
    """
    return torch.optim.lr_scheduler.StepLR(in_1, step_size=step_size, gamma=gamma)
