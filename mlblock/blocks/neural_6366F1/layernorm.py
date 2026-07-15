import torch
from torch import nn


def layernorm(x: "torch.Tensor", normalized_shape: "int") -> "torch.Tensor":
    """LayerNorm.
    
    Args:
        x: Input tensor.
        normalized_shape: Parameter.
    """
    return nn.Layernorm(normalized_shape=normalized_shape)(x)
