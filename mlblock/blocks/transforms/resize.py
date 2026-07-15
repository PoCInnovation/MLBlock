from torchvision.transforms import Resize as _Resize


def BUILD(params):
    return _Resize(size=params["size"])


BLOCK = {
    "label": "Resize",
    "category": "transform",
    "params": {
        "size": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Image"}],
    "outputs": [{"name": "out", "dtype": "Image"}],
    "template": (
        "from torchvision.transforms import Resize\n"
        "{output.out} = Resize({params.size})"
    ),
}
