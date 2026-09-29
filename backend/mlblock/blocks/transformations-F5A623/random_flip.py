def random_flip(in_1: "torch.utils.data.Dataset", p: "float" = 0.5) -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Random Flip.
    Retourne horizontalement aléatoirement les images du dataset (transform en tête).

    Args:
        in_1: Dataset image.
        p: Probabilité de flip. (entre: 0-1, pas: 0.05) (suggestions: 0.1|0.25|0.5|0.75)
    """
    from torchvision import transforms
    aug = transforms.RandomHorizontalFlip(p=p)
    in_1.transform = transforms.Compose([in_1.transform, aug]) if getattr(in_1, "transform", None) else aug
    return in_1
