import torch
from torch import nn


def dropout_layer(in_1: "torch.nn.Module" = None, p: "float" = 0.5) -> "torch.nn.Module":
    """Dropout Layer.
    Désactive aléatoirement des neurones pendant l'entraînement (régularisation), couche composable.

    Args:
        in_1: Couche précédente (optionnelle).
        p: Probabilité de dropout. (entre: 0-1, pas: 0.05) (suggestions: 0.1|0.25|0.5|0.75)
    """
    layer = nn.Dropout(p=p)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
