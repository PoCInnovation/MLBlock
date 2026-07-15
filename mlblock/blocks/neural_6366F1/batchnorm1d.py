import torch
from torch import nn


def batchnorm1d(x: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """BatchNorm1D.
    
    Args:
        x: Input tensor.
        num_features: Parameter.
    """
    return nn.Batchnorm1D(num_features=num_features)(x)
