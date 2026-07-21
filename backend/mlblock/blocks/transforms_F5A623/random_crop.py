from torchvision import transforms


def random_crop(in_1: "torch.Tensor", size: "int") -> "torch.Tensor":
    """Random crop.
    
    Args:
        in_1: Input image.
        size: Output size.
    """
    return transforms.RandomCrop(size)(in_1)
