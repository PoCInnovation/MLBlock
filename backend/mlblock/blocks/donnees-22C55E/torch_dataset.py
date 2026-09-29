def torch_dataset(name: "str" = "mnist", split: "str" = "train") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Torch Dataset.
    Charge MNIST, FashionMNIST ou CIFAR10 en Dataset (téléchargement auto).

    Args:
        name: Dataset (choix: mnist|fashion_mnist|cifar10).
        split: train ou test (choix: train|test).
    """
    from torchvision import datasets, transforms

    names = {"mnist": datasets.MNIST, "fashion_mnist": datasets.FashionMNIST, "cifar10": datasets.CIFAR10}
    if name not in names:
        raise ValueError(f"Dataset inconnu : {name} (choix: mnist|fashion_mnist|cifar10)")
    if split not in ("train", "test"):
        raise ValueError("split doit être 'train' ou 'test'")
    return names[name](
        root="/tmp/mlblock-datasets",
        train=split == "train",
        download=True,
        transform=transforms.ToTensor(),
    )
