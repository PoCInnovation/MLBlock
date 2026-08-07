import torch
from torch import nn


def linear_layer(in_features: "int", out_features: "int", in_1: "torch.nn.Module" = None, bias: "bool" = True) -> "torch.nn.Module":
    """Construire une couche (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Linear(in_features=in_features, out_features=out_features, bias=bias)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
