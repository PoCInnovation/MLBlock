import torch
from torch import nn


def instancenorm2d(x: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """InstanceNorm2D.
    
    Args:
        x: Input tensor.
        num_features: Parameter.
    """
    return nn.Instancenorm2D(num_features=num_features)(x)
