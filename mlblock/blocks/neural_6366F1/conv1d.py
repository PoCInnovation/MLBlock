import torch
from torch import nn


def conv1d(x: "torch.Tensor", in_channels: "int", out_channels: "int", kernel_size: "int" = 3, stride: "int" = 1, padding: "int" = 0, dilation: "int" = 1) -> "torch.Tensor":
    """Conv1D.
    
    Args:
        x: Input tensor.
        in_channels: Parameter.
        out_channels: Parameter.
        kernel_size: Parameter.
        stride: Parameter.
        padding: Parameter.
        dilation: Parameter.
    """
    return nn.Conv1D(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size, stride=stride, padding=padding, dilation=dilation)(x)
