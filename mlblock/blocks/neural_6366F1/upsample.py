import torch
from torch import nn


def upsample(x: "torch.Tensor", scale_factor: "int" = None, mode: "str" = 'nearest') -> "torch.Tensor":
    """Upsample.
    
    Args:
        x: Input tensor.
        scale_factor: Parameter.
        mode: Parameter.
    """
    return nn.Upsample(scale_factor=scale_factor, mode=mode)(x)
