import torch
from torch import nn


def leaky_relu(in_1: "torch.nn.Module" = None, negative_slope: "float" = 0.01) -> "torch.nn.Module":
    """Leaky ReLU.
    Active LeakyReLU composable : pente faible pour les valeurs négatives.

    Args:
        in_1: Couche précédente (optionnelle).
        negative_slope: Parameter.
    """
    layer = nn.LeakyReLU(negative_slope=negative_slope)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
