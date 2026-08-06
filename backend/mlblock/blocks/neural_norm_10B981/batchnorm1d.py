import torch
from torch import nn


def batchnorm1d(in_1: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """Normalisation par lots 1D.
    
    Args:
        in_1: Input tensor.
        num_features: Nombre de canaux. (entre: 1-4096) (suggestions: 16|32|64|128)
    """
    return nn.Batchnorm1D(num_features=num_features)(in_1)
