from __future__ import annotations

import torch
from torch import nn


class _FirstLinear(nn.Module):
    """Premier Module du graphe : enveloppe un tenseur source en entrée linéaire."""

    def __init__(self, in_features: int, out_features: int, bias: bool = True):
        super().__init__()
        self.linear = nn.Linear(in_features=in_features, out_features=out_features, bias=bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if x.dim() == 1:
            x = x.unsqueeze(0)
        if x.dim() > 2:
            x = x.flatten(start_dim=1)
        return self.linear(x)


def input_layer(in_1: "torch.Tensor" = None, in_features: "int" = 4, out_features: "int" = 16, bias: "bool" = True) -> "torch.nn.Module":  # noqa: F821
    """Input Layer.
    Entrée du réseau : enveloppe un tenseur source en premier Module composable.

    Args:
        in_1: Tenseur source (optionnel, chaînage aval).
        in_features: Dimension d'entrée. (entre: 1-4096) (suggestions: 4|16|32|64|128)
        out_features: Dimension de sortie. (entre: 1-4096) (suggestions: 16|32|64|128)
        bias: Biais appris.
    """
    return _FirstLinear(in_features=in_features, out_features=out_features, bias=bias)
