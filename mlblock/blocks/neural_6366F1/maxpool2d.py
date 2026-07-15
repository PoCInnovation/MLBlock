import torch
from torch import nn


def maxpool2d(x: "torch.Tensor", kernel_size: "int" = 2, stride: "int" = None) -> "torch.Tensor":
    """MaxPool2D.
    
    Args:
        x: Input tensor.
        kernel_size: Parameter.
        stride: Parameter.
    """
    return nn.MaxPool2d(kernel_size=kernel_size, stride=stride)(x)
