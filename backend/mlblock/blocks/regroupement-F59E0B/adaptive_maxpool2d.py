import torch
from torch import nn


def adaptive_maxpool2d(in_1: "torch.nn.Module" = None, output_size: "int" = 1) -> "torch.nn.Module":
    """Adaptive Max Pooling 2D.
    Pooling maximum avec taille de sortie fixe, composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        output_size: Taille de sortie. (entre: 1-16)
    """
    layer = nn.AdaptiveMaxPool2d(output_size=output_size)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
