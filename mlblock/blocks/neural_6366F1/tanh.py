import torch
from torch import nn


def tanh(x: "torch.Tensor") -> "torch.Tensor":
    """Tanh.
    
    Args:
        x: Input tensor.
    """
    return nn.Tanh()(x)
