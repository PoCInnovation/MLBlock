from __future__ import annotations

import torch
from torch import nn


class _GRUOut(nn.Module):
    """GRU dont forward ne retourne que le dernier état caché (pas le tuple)."""

    def __init__(self, gru: nn.Module, bidirectional: bool = False):
        super().__init__()
        self.gru = gru
        self.bidirectional = bidirectional

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        _, h_n = self.gru(x)
        if self.bidirectional:
            return torch.cat([h_n[-2], h_n[-1]], dim=-1)
        # Dernière couche : (num_layers, batch, hidden) → (batch, hidden)
        return h_n[-1]
