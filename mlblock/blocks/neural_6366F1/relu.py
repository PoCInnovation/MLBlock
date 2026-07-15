import torch
from torch import nn


def relu(x: "torch.Tensor") -> "torch.Tensor":
    """ReLU.
    
    Args:
        x: Input tensor.
    """
    return nn.ReLU()(x)
