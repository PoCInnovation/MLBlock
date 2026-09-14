import torch
from torch import nn


def flatten_layer(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Aplatissement.
    Aplatit le tenseur en 2D composable (batch, features).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Flatten()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
