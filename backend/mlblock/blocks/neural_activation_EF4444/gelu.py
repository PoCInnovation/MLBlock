import torch
from torch import nn


def gelu(in_1: "torch.Tensor") -> "torch.Tensor":
    """GELU.
    Active GELU : approximation gaussienne.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Gelu()(in_1)
