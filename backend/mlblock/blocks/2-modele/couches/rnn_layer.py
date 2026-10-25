from __future__ import annotations

import torch
from torch import nn


class _RNNOut(nn.Module):
    """RNN dont forward retourne le dernier état caché (pas le tuple)."""

    def __init__(self, rnn: nn.Module, bidirectional: bool = False):
        super().__init__()
        self.rnn = rnn
        self.bidirectional = bidirectional

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, h_n = self.rnn(x)
        if self.bidirectional:
            return torch.cat([h_n[-2], h_n[-1]], dim=-1)
        # Dernière couche : (num_layers, batch, hidden) → (batch, hidden)
        return h_n[-1]


def rnn_layer(input_size: "int", hidden_size: "int", in_1: "torch.nn.Module" = None, num_layers: "int" = 1, nonlinearity: "str" = "tanh", bias: "bool" = True, dropout: "float" = 0.0, bidirectional: "bool" = False) -> "torch.nn.Module":  # noqa: F821
    """RNN Layer.
    Cellule récurrente RNN composable (nn.Module) : retourne le dernier état caché.

    Args:
        in_1: Couche précédente (optionnelle).
        input_size: Taille d'entrée. (entre: 1-512, pas: 1)
        hidden_size: Taille cachée. (entre: 1-512, pas: 1) (suggestions: 8|16|32|64)
        num_layers: Nombre de couches. (entre: 1-8, pas: 1)
        nonlinearity: Activation interne. (choix: tanh|relu)
        bias: Biais.
        dropout: Probabilité de dropout. (entre: 0-1)
        bidirectional: Bidirectionnel.
    
    Exemple: rnn_layer(16, 32)
    """
    rnn = nn.RNN(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers, nonlinearity=nonlinearity, bias=bias, dropout=dropout, bidirectional=bidirectional, batch_first=True)
    layer = _RNNOut(rnn, bidirectional=bidirectional)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
