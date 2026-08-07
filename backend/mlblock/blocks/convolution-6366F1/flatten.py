import torch
from torch import nn


def flatten(in_1: "torch.Tensor") -> "torch.Tensor":
    """Aplatissement.
    Aplatit le tenseur en 2D (batch, features).
    
    Args:
        in_1: Input tensor.
    """
    return nn.Flatten()(in_1)
