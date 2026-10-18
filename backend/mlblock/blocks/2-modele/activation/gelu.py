import torch
from torch import nn


def gelu(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """GELU.
    Active GELU composable : approximation gaussienne.

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.GELU()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
