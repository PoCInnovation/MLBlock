import torch
from torch import nn


def elu(in_1: "torch.nn.Module" = None, alpha: "float" = 1.0) -> "torch.nn.Module":
    """ELU.
    Active ELU composable : exponentiel pour les valeurs négatives.

    Args:
        in_1: Couche précédente (optionnelle).
        alpha: Parameter.
    """
    layer = nn.ELU(alpha=alpha)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
