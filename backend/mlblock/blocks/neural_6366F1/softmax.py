import torch
from torch import nn


def softmax(in_1: "torch.Tensor", dim: "int" = 1) -> "torch.Tensor":
    """Softmax.
    
    Args:
        in_1: Input tensor.
        dim: Parameter.
    """
    return nn.Softmax(dim=dim)(in_1)
