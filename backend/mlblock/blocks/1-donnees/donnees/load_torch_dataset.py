DOWNLOAD_TIMEOUT_S = 60


def load_torch_dataset(name: "str", batch_size: "int" = 32, split: "str" = "train") -> "torch.utils.data.Dataset":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Load Torchvision Dataset.
    Charge MNIST, FashionMNIST ou CIFAR10 en Dataset (téléchargement auto).

    Le téléchargement est borné par DOWNLOAD_TIMEOUT_S : sans borne, un hôte
    à l'egress cassé bloque le run jusqu'au timeout GPU (observé en live).

    Args:
        name: Dataset (choix: mnist|fashion_mnist|cifar10).
        batch_size: Taille des lots (ignoré, conservé pour compatibilité).
        split: train ou test (choix: train|test).
    
    Exemple: load_torch_dataset("mnist")
    """
    import socket

    from torchvision import datasets, transforms

    names = {"mnist": datasets.MNIST, "fashion_mnist": datasets.FashionMNIST, "cifar10": datasets.CIFAR10}
    if name not in names:
        raise ValueError(f"Dataset inconnu : {name} (choix: mnist|fashion_mnist|cifar10)")
    if split not in ("train", "test"):
        raise ValueError("split doit être 'train' ou 'test'")
    prev = socket.getdefaulttimeout()
    socket.setdefaulttimeout(DOWNLOAD_TIMEOUT_S)
    try:
        return names[name](
            root="/tmp/mlblock-datasets",
            train=split == "train",
            download=True,
            transform=transforms.ToTensor(),
        )
    finally:
        socket.setdefaulttimeout(prev)
