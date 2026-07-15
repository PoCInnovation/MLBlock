from torchvision.transforms import RandomCrop as _RandomCrop


def BUILD(params):
    return _RandomCrop(size=params["size"])


BLOCK = {
    "label": "RandomCrop",
    "category": "transform",
    "params": {
        "size": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Image"}],
    "outputs": [{"name": "out", "dtype": "Image"}],
    "template": (
        "from torchvision.transforms import RandomCrop\n"
        "{output.out} = RandomCrop({params.size})"
    ),
}
