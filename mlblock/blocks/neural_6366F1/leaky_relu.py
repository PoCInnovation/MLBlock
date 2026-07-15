import torch
from torch import nn


def leaky_relu(in_1: "torch.Tensor", negative_slope: "float" = 0.01) -> "torch.Tensor":
    """LeakyReLU.
    
    Args:
        in_1: Input tensor.
        negative_slope: Parameter.
    """
    return nn.LeakyReLU(negative_slope=negative_slope)(in_1)
