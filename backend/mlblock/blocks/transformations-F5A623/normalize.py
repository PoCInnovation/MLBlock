def normalize(in_1: "torch.Tensor", mean: "list", std: "list") -> "torch.Tensor":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Normaliser un tenseur.
    Normalise un tenseur image par moyenne/écart-type.
    
    Args:
        in_1: Input tensor.
        mean: Moyennes par canal. (longueur: 3)
        std: Écarts-types par canal. (longueur: 3)
    """
    from torchvision import transforms
    return transforms.Normalize(mean=mean, std=std)(in_1)
