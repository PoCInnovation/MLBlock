import torch
from torch import nn


def flatten(in_1: "torch.Tensor") -> "torch.Tensor":
    """Flatten.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Flatten()(in_1)
