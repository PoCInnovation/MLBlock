from torchvision import transforms


def resize(in_1: "torch.Tensor", size: "int") -> "torch.Tensor":
    """Resize image.
    
    Args:
        in_1: Input image.
        size: Output size.
    """
    return transforms.Resize(size)(in_1)
