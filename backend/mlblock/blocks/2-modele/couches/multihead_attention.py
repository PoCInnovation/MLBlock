from __future__ import annotations

import torch
from torch import nn


class _SelfAttention(nn.Module):
    """Self-attention dont forward ne retourne que la sortie (pas le tuple)."""

    def __init__(self, mha: nn.Module):
        super().__init__()
        self.mha = mha

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # query == key == value ; poids d'attention non exposés (sortie unique).
        out, _ = self.mha(x, x, x)
        return out


def multihead_attention(embed_dim: "int", num_heads: "int", in_1: "torch.nn.Module" = None, dropout: "float" = 0.0, bias: "bool" = True) -> "torch.nn.Module":  # noqa: F821
    """Multi-Head Attention.
    Self-attention multi-têtes (transformers), composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        embed_dim: Dimension d'embedding. (entre: 1-1024) (suggestions: 64|128|256|512)
        num_heads: Nombre de têtes. (entre: 1-64) (suggestions: 1|2|4|8|16)
        dropout: Probabilité. (entre: 0-1) (suggestions: 0.1|0.25|0.5)
        bias: Biais.
    """
    layer = _SelfAttention(nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, dropout=dropout, bias=bias, batch_first=True))
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
