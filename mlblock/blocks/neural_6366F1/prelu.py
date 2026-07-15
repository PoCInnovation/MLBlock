import torch
from torch import nn


def prelu(x: "torch.Tensor", num_parameters: "int" = 1) -> "torch.Tensor":
    """PReLU.
    
    Args:
        x: Input tensor.
        num_parameters: Parameter.
    """
    return nn.Prelu(num_parameters=num_parameters)(x)
