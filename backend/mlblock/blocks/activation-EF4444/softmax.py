import torch
from torch import nn


def softmax(in_1: "torch.nn.Module" = None, dim: "int" = 1) -> "torch.nn.Module":
    """Softmax.
    Normalise les logits en probabilités (somme = 1).

    Args:
        in_1: Couche précédente (optionnelle).
        dim: Dimension. (entre: 0-4)
    """
    layer = nn.Softmax(dim=dim)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
