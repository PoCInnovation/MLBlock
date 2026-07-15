import torch
from torch import nn


def relu(in_1: "torch.Tensor") -> "torch.Tensor":
    """ReLU.
    
    Args:
        in_1: Input tensor.
    """
    return nn.ReLU()(in_1)
