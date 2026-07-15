import torch
from torch import nn


def conv_transpose2d(x: "torch.Tensor", in_channels: "int", out_channels: "int", kernel_size: "int" = 3, stride: "int" = 1, padding: "int" = 0, output_padding: "int" = 0) -> "torch.Tensor":
    """ConvTranspose2D.
    
    Args:
        x: Input tensor.
        in_channels: Parameter.
        out_channels: Parameter.
        kernel_size: Parameter.
        stride: Parameter.
        padding: Parameter.
        output_padding: Parameter.
    """
    return nn.ConvTranspose2D(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size, stride=stride, padding=padding, output_padding=output_padding)(x)
