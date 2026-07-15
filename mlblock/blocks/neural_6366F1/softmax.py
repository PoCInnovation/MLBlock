import torch
from torch import nn


def softmax(x: "torch.Tensor", dim: "int" = 1) -> "torch.Tensor":
    """Softmax.
    
    Args:
        x: Input tensor.
        dim: Parameter.
    """
    return nn.Softmax(dim=dim)(x)
