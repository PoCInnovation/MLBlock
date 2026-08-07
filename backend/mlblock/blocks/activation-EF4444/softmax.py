import torch
from torch import nn


def softmax(in_1: "torch.Tensor", dim: "int" = 1) -> "torch.Tensor":
    """Softmax.
    Normalise les logits en probabilités (somme = 1).
    
    Args:
        in_1: Input tensor.
        dim: Dimension. (entre: 0-4)
    """
    return nn.Softmax(dim=dim)(in_1)
