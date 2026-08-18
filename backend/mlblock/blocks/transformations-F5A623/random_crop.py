def random_crop(in_1: "torch.Tensor", size: "int") -> "torch.Tensor":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Recadrage aléatoire.
    Recadre aléatoirement le tenseur (augmentation).
    
    Args:
        in_1: Input image.
        size: Output size.
    """
    from torchvision import transforms
    return transforms.RandomCrop(size)(in_1)
