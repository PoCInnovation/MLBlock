import torch
from torch import nn


def layernorm(normalized_shape: "int", in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Layer Normalization.
    Normalise les activations par couche, couche composable.

    Args:
        normalized_shape: Forme normalisée. (entre: 1-4096) (suggestions: 16|32|64|128)
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.LayerNorm(normalized_shape=normalized_shape)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
