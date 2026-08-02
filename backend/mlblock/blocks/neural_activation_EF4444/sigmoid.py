import torch
from torch import nn


def sigmoid(in_1: "torch.Tensor") -> "torch.Tensor":
    """Sigmoid.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Sigmoid()(in_1)
