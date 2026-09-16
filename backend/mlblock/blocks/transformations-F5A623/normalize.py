def normalize(in_1: "torch.utils.data.Dataset", mean: "list", std: "list") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Normalize Dataset.
    Normalise un dataset image par moyenne/écart-type (transform en tête).

    Args:
        in_1: Dataset image.
        mean: Moyennes par canal. (longueur: 3)
        std: Écarts-types par canal. (longueur: 3)
    """
    from torchvision import transforms
    norm = transforms.Normalize(mean=mean, std=std)
    in_1.transform = transforms.Compose([in_1.transform, norm]) if getattr(in_1, "transform", None) else norm
    return in_1
