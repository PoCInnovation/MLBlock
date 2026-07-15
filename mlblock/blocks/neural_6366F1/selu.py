import torch
from torch import nn


def selu(x: "torch.Tensor") -> "torch.Tensor":
    """SELU.
    
    Args:
        x: Input tensor.
    """
    return nn.Selu()(x)
