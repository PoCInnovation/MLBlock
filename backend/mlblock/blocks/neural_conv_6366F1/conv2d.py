import torch
from torch import nn


def conv2d(in_1: "torch.Tensor", in_channels: "int", out_channels: "int", kernel_size: "int" = 3, stride: "int" = 1, padding: "int" = 0) -> "torch.Tensor":
    """Convolution 2D.
    
    Args:
        in_1: Input tensor.
        in_channels: Canaux d'entrée. (entre: 1-4096) (suggestions: 16|32|64|128|256)
        out_channels: Canaux de sortie. (entre: 1-4096) (suggestions: 16|32|64|128|256)
        kernel_size: Taille du filtre. (impair) (suggestions: 1|3|5|7)
        stride: Pas. (entre: 1-8)
        padding: Padding. (entre: 0-8)
    """
    return nn.Conv2d(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size, stride=stride, padding=padding)(in_1)
