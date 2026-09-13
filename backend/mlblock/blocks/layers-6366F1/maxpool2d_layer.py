import torch
from torch import nn


def maxpool2d_layer(kernel_size: "int" = 2, in_1: "torch.nn.Module" = None, stride: "int" = None) -> "torch.nn.Module":
    """Pool maximum 2D.
    Réduit la résolution par pooling maximum composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        kernel_size: Taille du filtre. (entre: 2-8)
        stride: Pas. (entre: 1-8)
    """
    layer = nn.MaxPool2d(kernel_size=kernel_size, stride=stride)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
