import torch
from torch import nn


def conv2d(in_1: "torch.Tensor", in_channels: "int", out_channels: "int", kernel_size: "int" = 3, stride: "int" = 1, padding: "int" = 0) -> "torch.Tensor":
    """Conv2D.
    
    Args:
        in_1: Input tensor.
        in_channels: Parameter.
        out_channels: Parameter.
        kernel_size: Parameter.
        stride: Parameter.
        padding: Parameter.
    """
    return nn.Conv2d(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size, stride=stride, padding=padding)(in_1)
