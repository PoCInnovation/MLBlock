import torch
from torch import nn


def relu(in_1: "torch.Tensor") -> "torch.Tensor":
    """ReLU.
    Active ReLU : max(0, x).
    
    Args:
        in_1: Input tensor.
    """
    return nn.ReLU()(in_1)
