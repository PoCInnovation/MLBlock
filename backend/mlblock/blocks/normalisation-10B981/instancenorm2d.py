import torch
from torch import nn


def instancenorm2d(in_1: "torch.Tensor", num_features: "int") -> "torch.Tensor":
    """Normalisation d'instance 2D.
    Normalise par instance (2D) — style transfer.
    
    Args:
        in_1: Input tensor.
        num_features: Nombre de canaux. (entre: 1-4096) (suggestions: 16|32|64|128)
    """
    return nn.Instancenorm2D(num_features=num_features)(in_1)
