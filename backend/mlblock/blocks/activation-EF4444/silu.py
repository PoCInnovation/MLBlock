import torch
from torch import nn


def silu(in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """SiLU.
    Active SiLU (swish) composable : x · sigmoid(x).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.SiLU()
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
