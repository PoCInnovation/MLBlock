import torch


def cosine_lr(in_1: "torch.optim.Optimizer", T_max: "int" = 100, eta_min: "float" = 0.0) -> "torch.optim.lr_scheduler.CosineAnnealingLR":
    """Taux d'apprentissage à cosinus.
    Décroissance du taux d'apprentissage en cosinus.
    
    Args:
        in_1: Optimizer.
        T_max: Itérations max. (entre: 1-1000)
        eta_min: LR minimum. (entre: 0-1)
    """
    return torch.optim.lr_scheduler.CosineAnnealingLR(in_1, T_max=T_max, eta_min=eta_min)
