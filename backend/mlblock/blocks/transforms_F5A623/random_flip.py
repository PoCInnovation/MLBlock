def random_flip(in_1: "torch.Tensor", p: "float" = 0.5) -> "torch.Tensor":
    """Retournement aléatoire.
    
    Args:
        in_1: Input image.
        p: Probabilité de flip. (entre: 0-1, pas: 0.05) (suggestions: 0.1|0.25|0.5|0.75)
    """
    from torchvision import transforms
    return transforms.RandomHorizontalFlip(p=p)(in_1)
