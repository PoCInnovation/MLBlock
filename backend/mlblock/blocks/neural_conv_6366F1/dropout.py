import torch
from torch import nn


def dropout(in_1: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Abandon (dropout).
    
    Args:
        in_1: Input tensor.
        p: Probabilité de dropout. (entre: 0-1, pas: 0.05) (suggestions: 0.1|0.25|0.5|0.75)
    """
    return nn.Dropout(p=p)(in_1)
