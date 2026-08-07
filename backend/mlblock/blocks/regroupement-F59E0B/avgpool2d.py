import torch
from torch import nn


def avgpool2d(in_1: "torch.Tensor", kernel_size: "int" = 2) -> "torch.Tensor":
    """Pool moyen.
    Réduit la résolution par pooling moyen.
    
    Args:
        in_1: Input tensor.
        kernel_size: Taille du filtre. (entre: 2-8)
    """
    return nn.Avgpool2D(kernel_size=kernel_size)(in_1)
