import torch
from torch import nn


def instancenorm2d(in_1: "torch.nn.Module" = None, num_features: "int" = 1) -> "torch.nn.Module":
    """Instance Normalization 2D.
    Normalise par instance (2D) — style transfer. Composable (nn.Module), affine appris.

    Args:
        in_1: Couche précédente (optionnelle).
        num_features: Nombre de canaux. (entre: 1-4096) (suggestions: 16|32|64|128)
    """
    layer = nn.InstanceNorm2d(num_features=num_features, affine=True)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
