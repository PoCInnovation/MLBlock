import torch
from torch import nn


def conv2d_layer(in_channels: "int", out_channels: "int", in_1: "torch.nn.Module" = None, kernel_size: "int" = 3) -> "torch.nn.Module":
    """Construire une couche (module composable).

    Args:
        in_1: Couche précédente (optionnelle).
    """
    layer = nn.Conv2d(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
