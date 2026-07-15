import torch
from torch import nn


def adaptive_avgpool2d(x: "torch.Tensor", output_size: "int" = 1) -> "torch.Tensor":
    """AdaptiveAvgPool2D.
    
    Args:
        x: Input tensor.
        output_size: Parameter.
    """
    return nn.AdaptiveAvgpool2D(output_size=output_size)(x)
