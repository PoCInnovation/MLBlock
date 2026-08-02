import torch
from torch import nn


def prelu(in_1: "torch.Tensor", num_parameters: "int" = 1) -> "torch.Tensor":
    """PReLU.
    
    Args:
        in_1: Input tensor.
        num_parameters: Parameter.
    """
    return nn.Prelu(num_parameters=num_parameters)(in_1)
