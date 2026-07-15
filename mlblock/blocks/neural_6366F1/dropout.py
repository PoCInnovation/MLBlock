import torch
from torch import nn


def dropout(x: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Dropout.
    
    Args:
        x: Input tensor.
        p: Parameter.
    """
    return nn.Dropout(p=p)(x)
