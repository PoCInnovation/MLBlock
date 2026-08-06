def random_flip(in_1: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Random horizontal flip.
    
    Args:
        in_1: Input image.
        p: Probabilité de flip. (entre: 0-1, pas: 0.05)
    """
    from torchvision import transforms
    return transforms.RandomHorizontalFlip(p=p)(in_1)
