import torch
from torch import nn


def tanh(in_1: "torch.Tensor") -> "torch.Tensor":
    """Tangente hyperbolique.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Tanh()(in_1)
