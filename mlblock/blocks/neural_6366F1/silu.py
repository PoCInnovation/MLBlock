import torch
from torch import nn


def silu(x: "torch.Tensor") -> "torch.Tensor":
    """SiLU.
    
    Args:
        x: Input tensor.
    """
    return nn.Silu()(x)
