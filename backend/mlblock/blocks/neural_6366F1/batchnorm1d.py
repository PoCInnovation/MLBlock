import torch
from torch import nn


def batchnorm1d(in_1: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """BatchNorm1D.
    
    Args:
        in_1: Input tensor.
        num_features: Parameter.
    """
    return nn.Batchnorm1D(num_features=num_features)(in_1)
