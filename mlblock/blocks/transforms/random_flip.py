from torchvision.transforms import RandomHorizontalFlip as _RandomHorizontalFlip


def BUILD(params):
    return _RandomHorizontalFlip(p=params.get("p", 0.5))


BLOCK = {
    "label": "RandomHorizontalFlip",
    "category": "transform",
    "params": {
        "p": {"type": "float", "default": 0.5},
    },
    "inputs": [{"name": "in", "dtype": "Image"}],
    "outputs": [{"name": "out", "dtype": "Image"}],
    "template": (
        "from torchvision.transforms import RandomHorizontalFlip\n"
        "{output.out} = RandomHorizontalFlip(p={params.p})"
    ),
}
