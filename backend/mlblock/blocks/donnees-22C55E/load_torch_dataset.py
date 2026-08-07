def load_torch_dataset(name: "str", batch_size: "int" = 32, split: "str" = "train") -> "torch.utils.data.DataLoader":
    """Charger un dataset torchvision.
    Charge MNIST, FashionMNIST ou CIFAR10 en DataLoader (téléchargement auto).

    Args:
        name: Dataset (choix: mnist|fashion_mnist|cifar10).
        batch_size: Taille des lots.
        split: train ou test (choix: train|test).
    """
    import torch
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms

    names = {"mnist": datasets.MNIST, "fashion_mnist": datasets.FashionMNIST, "cifar10": datasets.CIFAR10}
    if name not in names:
        raise ValueError(f"Dataset inconnu : {name} (choix: mnist|fashion_mnist|cifar10)")
    if split not in ("train", "test"):
        raise ValueError("split doit être 'train' ou 'test'")
    ds = names[name](
        root="/tmp/mlblock-datasets",
        train=split == "train",
        download=True,
        transform=transforms.ToTensor(),
    )
    return DataLoader(ds, batch_size=batch_size, shuffle=split == "train")
