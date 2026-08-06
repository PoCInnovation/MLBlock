def resize(in_1: "torch.Tensor", size: "int") -> "torch.Tensor":
    """Redimensionnement.
    Redimensionne le tenseur image.
    
    Args:
        in_1: Input image.
        size: Output size.
    """
    from torchvision import transforms
    return transforms.Resize(size)(in_1)
