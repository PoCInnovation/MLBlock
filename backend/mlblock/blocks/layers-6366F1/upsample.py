from typing import Literal

import torch
from torch import nn


def upsample(in_1: "torch.nn.Module" = None, scale_factor: "int" = None, mode: Literal["nearest", "bilinear", "bicubic", "trilinear"] = 'nearest') -> "torch.nn.Module":
    """Upsample.
    Sur-échantillonne le tenseur (agrandit la résolution), composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        scale_factor: Facteur d'échelle. (entre: 1-8) (suggestions: 2|3|4)
        mode: Parameter.
    """
    layer = nn.Upsample(scale_factor=scale_factor, mode=mode)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
