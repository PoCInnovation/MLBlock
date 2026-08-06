import torch
from torch import nn


def identity(in_1: "torch.Tensor") -> "torch.Tensor":
    """Identité.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Identity()(in_1)
