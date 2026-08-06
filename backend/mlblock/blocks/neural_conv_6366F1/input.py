import torch
from torch import nn


def input(shape: "list[int]") -> "torch.Tensor":
    """Input.

    Args:
        shape: Forme d'entrée. (format: [C,H,W] | [N,C,H,W])
    """
    raise NotImplementedError("input is a virtual block, not a model layer")
