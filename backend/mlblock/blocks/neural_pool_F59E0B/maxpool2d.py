import torch
from torch import nn


def maxpool2d(in_1: "torch.Tensor", kernel_size: "int" = 2, stride: "int" = None) -> "torch.Tensor":
    """Pool maximum.
    
    Args:
        in_1: Input tensor.
        kernel_size: Taille du filtre. (entre: 2-8)
        stride: Pas. (entre: 1-8)
    """
    return nn.MaxPool2d(kernel_size=kernel_size, stride=stride)(in_1)
