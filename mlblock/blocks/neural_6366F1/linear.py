import torch
from torch import nn


def linear(x: "torch.Tensor", in_features: "int", out_features: "int", bias: "bool" = True) -> "torch.Tensor":
    """Linear (FC).
    
    Args:
        x: Input tensor.
        in_features: Parameter.
        out_features: Parameter.
        bias: Parameter.
    """
    return nn.Linear(in_features=in_features, out_features=out_features, bias=bias)(x)
