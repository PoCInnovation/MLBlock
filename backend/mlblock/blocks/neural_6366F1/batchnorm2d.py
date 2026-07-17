import torch
from torch import nn


def batchnorm2d(in_1: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """BatchNorm2D.
    
    Args:
        in_1: Input tensor.
        num_features: Parameter.
    """
    return nn.BatchNorm2d(num_features=num_features)(in_1)
