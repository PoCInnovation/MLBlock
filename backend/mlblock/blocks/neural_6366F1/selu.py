import torch
from torch import nn


def selu(in_1: "torch.Tensor") -> "torch.Tensor":
    """SELU.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Selu()(in_1)
