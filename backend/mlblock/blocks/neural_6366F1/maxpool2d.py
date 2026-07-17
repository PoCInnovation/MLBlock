import torch
from torch import nn


def maxpool2d(in_1: "torch.Tensor", kernel_size: "int" = 2, stride: "int" = None) -> "torch.Tensor":
    """MaxPool2D.
    
    Args:
        in_1: Input tensor.
        kernel_size: Parameter.
        stride: Parameter.
    """
    return nn.MaxPool2d(kernel_size=kernel_size, stride=stride)(in_1)
