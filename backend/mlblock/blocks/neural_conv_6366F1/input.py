import torch
from torch import nn


def input(shape: "list[int]") -> "torch.Tensor":
    """Input.

    Args:
        shape: Parameter.
    """
    raise NotImplementedError("input is a virtual block, not a model layer")
