import torch
from torch import nn


def linear(in_1: "torch.Tensor", in_features: "int", out_features: "int", bias: "bool" = True) -> "torch.Tensor":
    """Linear (FC).
    
    Args:
        in_1: Input tensor.
        in_features: Entrées. (entre: 1-4096)
        out_features: Sorties. (entre: 1-4096)
        bias: Parameter.
    """
    return nn.Linear(in_features=in_features, out_features=out_features, bias=bias)(in_1)
