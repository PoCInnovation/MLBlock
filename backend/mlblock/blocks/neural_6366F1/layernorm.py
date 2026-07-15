import torch
from torch import nn


def layernorm(in_1: "torch.Tensor", normalized_shape: "int") -> "torch.Tensor":
    """LayerNorm.
    
    Args:
        in_1: Input tensor.
        normalized_shape: Parameter.
    """
    return nn.Layernorm(normalized_shape=normalized_shape)(in_1)
