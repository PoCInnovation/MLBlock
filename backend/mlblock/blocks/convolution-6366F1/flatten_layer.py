import torch
from torch import nn


def flatten_layer(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Construire une couche (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Flatten()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
