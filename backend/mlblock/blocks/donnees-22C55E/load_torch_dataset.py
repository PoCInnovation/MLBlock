def load_torch_dataset(name: "str", batch_size: "int" = 32, split: "str" = "train") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Load Torchvision Dataset.
    Charge MNIST, FashionMNIST ou CIFAR10 en Dataset (téléchargement auto).
    Déprécié : préférez torch_dataset + data_loader.

    Args:
        name: Dataset (choix: mnist|fashion_mnist|cifar10).
        batch_size: Taille des lots (ignoré, conservé pour compatibilité).
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
