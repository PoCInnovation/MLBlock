import torch
from torch import nn


def avgpool2d(in_1: "torch.Tensor", kernel_size: "int" = 2) -> "torch.Tensor":
    """AvgPool2D.
    
    Args:
        in_1: Input tensor.
        kernel_size: Parameter.
    """
    return nn.Avgpool2D(kernel_size=kernel_size)(in_1)
