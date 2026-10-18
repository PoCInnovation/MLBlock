import torch
from torch import nn


def batchnorm1d(num_features: "int", in_1: "torch.nn.Module" = None) -> "torch.nn.Module":
    """Batch Normalization 1D.
    Normalise les activations par lots (1D), couche composable.

    Args:
        num_features: Nombre de canaux. (entre: 1-4096) (suggestions: 16|32|64|128)
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.BatchNorm1d(num_features=num_features)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
