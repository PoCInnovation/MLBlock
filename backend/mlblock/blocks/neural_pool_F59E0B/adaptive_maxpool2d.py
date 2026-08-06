import torch
from torch import nn


def adaptive_maxpool2d(in_1: "torch.Tensor", output_size: "int" = 1) -> "torch.Tensor":
    """AdaptiveMaxPool2D.
    
    Args:
        in_1: Input tensor.
        output_size: Taille de sortie. (entre: 1-16)
    """
    return nn.AdaptiveMaxpool2D(output_size=output_size)(in_1)
