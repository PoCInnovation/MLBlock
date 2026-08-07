import torch
from torch import nn


def silu(in_1: "torch.Tensor") -> "torch.Tensor":
    """SiLU.
    Active SiLU (swish) : x · sigmoid(x).
    
    Args:
        in_1: Input tensor.
    """
    return nn.Silu()(in_1)
