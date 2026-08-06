import torch
from torch import nn


def input(shape: "list[int]") -> "torch.Tensor":
    """Entrée du modèle.

    Args:
        shape: Forme d'entrée. (format: [C,H,W] | [N,C,H,W]) (suggestions: [1, 28, 28]|[3, 32, 32]|[1, 3, 224, 224])
    """
    raise NotImplementedError("input is a virtual block, not a model layer")
