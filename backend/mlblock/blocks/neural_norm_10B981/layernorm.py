import torch
from torch import nn


def layernorm(in_1: "torch.Tensor", normalized_shape: "int") -> "torch.Tensor":
    """LayerNorm.
    
    Args:
        in_1: Input tensor.
        normalized_shape: Forme normalisée. (entre: 1-4096)
    """
    return nn.Layernorm(normalized_shape=normalized_shape)(in_1)
