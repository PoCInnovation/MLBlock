import torch
from torchvision import transforms


def normalize(in_1: "torch.Tensor", mean: "list", std: "list") -> "torch.Tensor":
    """Normalize tensor.
    
    Args:
        in_1: Input tensor.
        mean: Mean values.
        std: Standard deviation values.
    """
    return transforms.Normalize(mean=mean, std=std)(in_1)
