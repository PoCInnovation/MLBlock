import torch
from torch import nn


def adaptive_avgpool2d(in_1: "torch.Tensor", output_size: "int" = 1) -> "torch.Tensor":
    """Pool moyen adaptatif.
    
    Args:
        in_1: Input tensor.
        output_size: Taille de sortie. (entre: 1-16)
    """
    return nn.AdaptiveAvgpool2D(output_size=output_size)(in_1)
