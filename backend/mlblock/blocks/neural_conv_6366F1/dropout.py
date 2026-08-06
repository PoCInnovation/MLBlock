import torch
from torch import nn


def dropout(in_1: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Dropout.
    
    Args:
        in_1: Input tensor.
        p: Probabilité de dropout. (entre: 0-1, pas: 0.05)
    """
    return nn.Dropout(p=p)(in_1)
