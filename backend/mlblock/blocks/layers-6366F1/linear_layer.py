import torch
from torch import nn


def linear_layer(in_features: "int", out_features: "int", in_1: "torch.nn.Module" = None, bias: "bool" = True) -> "torch.nn.Module":
    """Couche linéaire (dense).
    Couche entièrement connectée composable : transforme l'entrée par une matrice apprise.

    Args:
        in_1: Couche précédente (optionnelle).
        in_features: Entrées. (entre: 1-4096) (suggestions: 16|32|64|128|256|512)
        out_features: Sorties. (entre: 1-4096) (suggestions: 16|32|64|128|256|512)
        bias: Biais appris.
    """
    layer = nn.Linear(in_features=in_features, out_features=out_features, bias=bias)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
