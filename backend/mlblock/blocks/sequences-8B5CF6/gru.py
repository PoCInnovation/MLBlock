from __future__ import annotations

import torch
from torch import nn


class _GRUOut(nn.Module):
    """GRU dont forward ne retourne que la sortie (pas le tuple (out, hidden))."""

    def __init__(self, gru: nn.Module):
        super().__init__()
        self.gru = gru

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.gru(x)
        # Dernier pas de temps : (batch, seq, hidden) → (batch, hidden)
        return out[:, -1, :]


def gru(input_size: "int", hidden_size: "int", in_1: "torch.nn.Module" = None, num_layers: "int" = 1, bias: "bool" = True, dropout: "float" = 0.0, bidirectional: "bool" = False) -> "torch.nn.Module":  # noqa: F821
    """GRU.
    Cellule récurrente GRU composable (nn.Module) : retourne le dernier pas de temps.

    Args:
        in_1: Couche précédente (optionnelle).
        input_size: Taille d'entrée. (suggestions: 16|32|64|128)
        hidden_size: Taille cachée. (suggestions: 32|64|128|256)
        num_layers: Nombre de couches.
        bias: Biais.
        dropout: Probabilité de dropout. (entre: 0-1) (suggestions: 0.1|0.25|0.5)
        bidirectional: Bidirectionnel.
    """
    layer = _GRUOut(nn.GRU(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, bias=bias, batch_first=True, dropout=dropout, bidirectional=bidirectional))
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
