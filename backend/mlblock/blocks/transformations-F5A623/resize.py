def resize(in_1: "torch.utils.data.Dataset", size: "int") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Resize.
    Redimensionne les images du dataset (transform en tête).

    Args:
        in_1: Dataset image.
        size: Output size.
    """
    from torchvision import transforms
    aug = transforms.Resize(size)
    in_1.transform = transforms.Compose([in_1.transform, aug]) if getattr(in_1, "transform", None) else aug
    return in_1
