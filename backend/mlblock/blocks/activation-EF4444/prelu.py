import torch
from torch import nn


def prelu(in_1: "torch.nn.Module" = None, num_parameters: "int" = 1) -> "torch.nn.Module":
    """PReLU.
    Active PReLU composable : pente négative apprise.

    Args:
        in_1: Couche précédente (optionnelle).
        num_parameters: Nombre de pentes apprises.
    """
    layer = nn.PReLU(num_parameters=num_parameters)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
