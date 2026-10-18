from __future__ import annotations

import torch
from torch import nn


class _LSTMOut(nn.Module):
    """LSTM dont forward ne retourne que le dernier état caché (pas le tuple)."""

    def __init__(self, lstm: nn.Module, bidirectional: bool = False):
        super().__init__()
        self.lstm = lstm
        self.bidirectional = bidirectional

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, (h_n, _) = self.lstm(x)
        if self.bidirectional:
            return torch.cat([h_n[-2], h_n[-1]], dim=-1)
        # Dernière couche : (num_layers, batch, hidden) → (batch, hidden)
        return h_n[-1]


def lstm_layer(input_size: "int", hidden_size: "int", in_1: "torch.nn.Module" = None, num_layers: "int" = 1, bias: "bool" = True, batch_first: "bool" = True, dropout: "float" = 0.0, bidirectional: "bool" = False) -> "torch.nn.Module":  # noqa: F821
    """LSTM Layer.
    Cellule récurrente LSTM composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        input_size: Taille d'entrée. (entre: 1-512, pas: 1) (suggestions: 16|32|64|128)
        hidden_size: Taille cachée. (entre: 1-512, pas: 1) (suggestions: 32|64|128|256)
        num_layers: Nombre de couches.
        bias: Biais.
        batch_first: Batch en premier.
        dropout: Probabilité de dropout. (entre: 0-1)
        bidirectional: Bidirectionnel.
    """
    layer = _LSTMOut(nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, bias=bias, batch_first=batch_first, dropout=dropout, bidirectional=bidirectional), bidirectional=bidirectional)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
