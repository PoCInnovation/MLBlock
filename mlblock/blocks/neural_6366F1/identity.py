import torch
from torch import nn


def identity(x: "torch.Tensor") -> "torch.Tensor":
    """Identity.
    
    Args:
        x: Input tensor.
    """
    return nn.Identity()(x)
