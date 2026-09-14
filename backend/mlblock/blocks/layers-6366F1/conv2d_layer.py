from __future__ import annotations


def conv2d_layer(in_channels: "int", out_channels: "int", in_1: "torch.nn.Module" = None, kernel_size: "int" = 3, stride: "int" = 1, padding: "int" = 0) -> "torch.nn.Module":  # noqa: F821
    """Convolution 2D.
    Couche de convolution 2D composable (nn.Module).

    Args:
        in_1: Couche précédente (optionnelle).
        in_channels: Canaux d'entrée. (entre: 1-4096) (suggestions: 16|32|64|128|256)
        out_channels: Canaux de sortie. (entre: 1-4096) (suggestions: 16|32|64|128|256)
        kernel_size: Taille du filtre. (impair) (suggestions: 1|3|5|7)
        stride: Pas. (entre: 1-8)
        padding: Padding. (entre: 0-8)
    """
    from torch import nn

    layer = nn.Conv2d(in_channels=in_channels, out_channels=out_channels, kernel_size=kernel_size, stride=stride, padding=padding)
    return nn.Sequential(in_1, layer) if in_1 is not None else layer
