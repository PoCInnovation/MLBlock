import torch
from torch import nn


def sigmoid(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Sigmoid.
    Active sigmoïde composable : compresse entre 0 et 1.

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Sigmoid()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
