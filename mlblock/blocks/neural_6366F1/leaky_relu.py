import torch
from torch import nn


def leaky_relu(x: "torch.Tensor", negative_slope: "float" = 0.01) -> "torch.Tensor":
    """LeakyReLU.
    
    Args:
        x: Input tensor.
        negative_slope: Parameter.
    """
    return nn.LeakyReLU(negative_slope=negative_slope)(x)
