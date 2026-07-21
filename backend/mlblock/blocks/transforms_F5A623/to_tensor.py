import torch
from torchvision import transforms


def to_tensor(in_1: "object") -> "torch.Tensor":
    """Convert to tensor.
    
    Args:
        in_1: Input image.
    """
    return transforms.ToTensor()(in_1)
