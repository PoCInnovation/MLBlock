import torch
from torch import nn


def identity(in_1: "torch.Tensor") -> "torch.Tensor":
    """Identité.
    Ne modifie pas l'entrée (passe-through).
    
    Args:
        in_1: Input tensor.
    """
    return nn.Identity()(in_1)
