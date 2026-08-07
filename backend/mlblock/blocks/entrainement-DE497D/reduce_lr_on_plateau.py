from typing import Literal

import torch


def reduce_lr_on_plateau(in_1: "torch.optim.Optimizer", mode: Literal["min", "max"] = "min", factor: "float" = 0.1, patience: "int" = 10) -> "torch.optim.lr_scheduler.ReduceLROnPlateau":
    """Réduction du taux sur plateau.
    Réduit le taux d'apprentissage quand la perte stagne.
    
    Args:
        in_1: Optimizer.
        mode: One of 'min' or 'max'.
        factor: Facteur de réduction. (entre: 0-1)
        patience: Patience. (entre: 1-100)
    """
    return torch.optim.lr_scheduler.ReduceLROnPlateau(in_1, mode=mode, factor=factor, patience=patience)
