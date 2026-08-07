import torch
from torch import nn


def multihead_attention(in_1: "torch.Tensor", embed_dim: "int", num_heads: "int", dropout: "float" = 0.0, bias: "bool" = True, batch_first: "bool" = True) -> "torch.Tensor":
    """Attention multi-têtes.
    Attention multi-têtes (transformers).
    
    Args:
        in_1: Input tensor.
        embed_dim: Dimension d'embedding. (entre: 1-1024) (suggestions: 64|128|256|512)
        num_heads: Nombre de têtes. (entre: 1-64) (suggestions: 1|2|4|8|16)
        dropout: Probabilité. (entre: 0-1) (suggestions: 0.1|0.25|0.5)
        bias: Parameter.
        batch_first: Parameter.
    """
    return nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, bias=bias, batch_first=batch_first)(in_1)
