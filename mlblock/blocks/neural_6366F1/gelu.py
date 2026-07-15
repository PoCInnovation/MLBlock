import torch
from torch import nn


def gelu(x: "torch.Tensor") -> "torch.Tensor":
    """GELU.
    
    Args:
        x: Input tensor.
    """
    return nn.Gelu()(x)
