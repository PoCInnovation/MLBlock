from typing import Literal

import torch
from torch import nn


def upsample(in_1: "torch.Tensor", scale_factor: "int" = None, mode: Literal["nearest", "bilinear", "bicubic", "trilinear"] = 'nearest') -> "torch.Tensor":
    """Upsample.
    
    Args:
        in_1: Input tensor.
        scale_factor: Facteur d'échelle. (entre: 1-8)
        mode: Parameter.
    """
    return nn.Upsample(scale_factor=scale_factor, mode=mode)(in_1)
