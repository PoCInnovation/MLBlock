import torch
from torch import nn


def sigmoid(in_1: "torch.Tensor") -> "torch.Tensor":
    """Sigmoïde.
    Active sigmoïde : compresse entre 0 et 1.
    
    Args:
        in_1: Input tensor.
    """
    return nn.Sigmoid()(in_1)
