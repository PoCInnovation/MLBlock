import torch
from torch import nn


def rnn_layer(input_size: "int", hidden_size: "int", in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Construire une couche (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.RNN(input_size=input_size, hidden_size=hidden_size, batch_first=True)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
