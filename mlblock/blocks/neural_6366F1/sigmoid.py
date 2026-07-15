import torch
from torch import nn


def sigmoid(x: "torch.Tensor") -> "torch.Tensor":
    """Sigmoid.
    
    Args:
        x: Input tensor.
    """
    return nn.Sigmoid()(x)
