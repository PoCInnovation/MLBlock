import torch
from torch import nn


class _RNNOut(nn.Module):
    """RNN dont forward ne retourne que la sortie (pas le tuple (out, hidden))."""

    def __init__(self, rnn: nn.Module):
        super().__init__()
        self.rnn = rnn

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out, _ = self.rnn(x)
        # Dernier pas de temps : (batch, seq, hidden) → (batch, hidden)
        return out[:, -1, :]


def rnn_layer(input_size: "int", hidden_size: "int", in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Construire une couche RNN (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
        input_size: Taille d'entrée. (entre: 1-512, pas: 1)
        hidden_size: Taille cachée. (entre: 1-512, pas: 1) (suggestions: 8|16|32|64)
    """
    layer = _RNNOut(nn.RNN(input_size=input_size, hidden_size=hidden_size, batch_first=True))
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
