import torch
from torch import nn


def maxpool2d_layer(kernel_size: "int" = 2, in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Construire une couche (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.MaxPool2d(kernel_size=kernel_size)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
