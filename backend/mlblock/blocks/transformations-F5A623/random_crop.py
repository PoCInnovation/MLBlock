def random_crop(in_1: "torch.utils.data.Dataset", size: "int") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Random Crop.
    Recadre aléatoirement les images du dataset (augmentation, transform en tête).

    Args:
        in_1: Dataset image.
        size: Output size.
    """
    from torchvision import transforms
    aug = transforms.RandomCrop(size)
    in_1.transform = transforms.Compose([in_1.transform, aug]) if getattr(in_1, "transform", None) else aug
    return in_1
