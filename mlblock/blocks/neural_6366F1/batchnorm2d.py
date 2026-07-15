import torch
from torch import nn


def batchnorm2d(x: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """BatchNorm2D.
    
    Args:
        x: Input tensor.
        num_features: Parameter.
    """
    return nn.BatchNorm2d(num_features=num_features)(x)
