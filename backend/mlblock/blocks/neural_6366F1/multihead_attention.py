import torch
from torch import nn


def multihead_attention(in_1: "torch.Tensor", embed_dim: "int", num_heads: "int", dropout: "float" = 0.0, bias: "bool" = True, batch_first: "bool" = True) -> "torch.Tensor":
    """MultiheadAttention.
    
    Args:
        in_1: Input tensor.
        embed_dim: Parameter.
        num_heads: Parameter.
        dropout: Parameter.
        bias: Parameter.
        batch_first: Parameter.
    """
    return nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, bias=bias, batch_first=batch_first)(in_1)
