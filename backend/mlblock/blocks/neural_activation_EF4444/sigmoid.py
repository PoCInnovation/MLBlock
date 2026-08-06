import torch
from torch import nn


def sigmoid(in_1: "torch.Tensor") -> "torch.Tensor":
    """Sigmoïde.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Sigmoid()(in_1)
