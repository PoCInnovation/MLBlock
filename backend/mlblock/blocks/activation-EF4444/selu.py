import torch
from torch import nn


def selu(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """SELU.
    Active SELU composable : auto-normalisante.

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.SELU()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
