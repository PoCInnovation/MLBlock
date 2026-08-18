def to_tensor(in_1: "PIL.Image.Image | numpy.ndarray") -> "torch.Tensor":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Convertir en tenseur.
    Convertit une image (PIL ou ndarray HWC) en tenseur CHW.

    Args:
        in_1: Input image (PIL.Image ou ndarray HWC).
    """
    from torchvision import transforms
    return transforms.ToTensor()(in_1)
