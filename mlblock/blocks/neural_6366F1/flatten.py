import torch
from torch import nn


def flatten(x: "torch.Tensor") -> "torch.Tensor":
    """Flatten.
    
    Args:
        x: Input tensor.
    """
    return nn.Flatten()(x)
