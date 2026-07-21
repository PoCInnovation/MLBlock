from torchvision import transforms


def random_flip(in_1: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Random horizontal flip.
    
    Args:
        in_1: Input image.
        p: Probability of flipping.
    """
    return transforms.RandomHorizontalFlip(p=p)(in_1)
