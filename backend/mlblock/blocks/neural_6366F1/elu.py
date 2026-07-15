import torch
from torch import nn


def elu(in_1: "torch.Tensor", alpha: "float" = 1.0) -> "torch.Tensor":
    """ELU.
    
    Args:
        in_1: Input tensor.
        alpha: Parameter.
    """
    return nn.Elu(alpha=alpha)(in_1)
