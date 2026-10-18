import torch
from torch import nn


def tanh(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Tanh.
    Active tangente hyperbolique composable : compresse entre -1 et 1.

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Tanh()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
