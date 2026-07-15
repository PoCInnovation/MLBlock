import torch
from torch import nn


def input(shape: "list[int]") -> "torch.Tensor":
    """Input.
    
    Args:
        shape: Parameter.
    """
    return nn.Input(shape=shape)(x)
