import torch
from torch import nn


def avgpool2d(in_1: "torch.nn.Module" = None, kernel_size: "int" = 2) -> "torch.nn.Module":
    """Average Pooling 2D.
    Réduit la résolution par pooling moyen, composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        kernel_size: Taille du filtre. (entre: 2-8)
    """
    layer = nn.AvgPool2d(kernel_size=kernel_size)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
