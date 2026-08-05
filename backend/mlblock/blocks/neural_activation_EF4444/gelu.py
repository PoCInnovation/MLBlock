import torch
from torch import nn


def gelu(in_1: "torch.Tensor") -> "torch.Tensor":
    """GELU.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Gelu()(in_1)
