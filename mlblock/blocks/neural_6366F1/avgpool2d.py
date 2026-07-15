import torch
from torch import nn


def avgpool2d(x: "torch.Tensor", kernel_size: "int" = 2) -> "torch.Tensor":
    """AvgPool2D.
    
    Args:
        x: Input tensor.
        kernel_size: Parameter.
    """
    return nn.Avgpool2D(kernel_size=kernel_size)(x)
