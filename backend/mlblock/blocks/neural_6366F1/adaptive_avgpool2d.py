import torch
from torch import nn


def adaptive_avgpool2d(in_1: "torch.Tensor", output_size: "int" = 1) -> "torch.Tensor":
    """AdaptiveAvgPool2D.
    
    Args:
        in_1: Input tensor.
        output_size: Parameter.
    """
    return nn.AdaptiveAvgpool2D(output_size=output_size)(in_1)
