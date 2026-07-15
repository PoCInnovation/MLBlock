import torch
from torch import nn


def adaptive_maxpool2d(x: "torch.Tensor", output_size: "int" = 1) -> "torch.Tensor":
    """AdaptiveMaxPool2D.
    
    Args:
        x: Input tensor.
        output_size: Parameter.
    """
    return nn.AdaptiveMaxpool2D(output_size=output_size)(x)
