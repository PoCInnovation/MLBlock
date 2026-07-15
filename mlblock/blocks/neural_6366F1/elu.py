import torch
from torch import nn


def elu(x: "torch.Tensor", alpha: "float" = 1.0) -> "torch.Tensor":
    """ELU.
    
    Args:
        x: Input tensor.
        alpha: Parameter.
    """
    return nn.Elu(alpha=alpha)(x)
