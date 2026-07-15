from torchvision.transforms import ToTensor as _ToTensor


def BUILD(params):
    return _ToTensor()


BLOCK = {
    "label": "ToTensor",
    "category": "transform",
    "params": {},
    "inputs": [{"name": "in", "dtype": "Image"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "from torchvision.transforms import ToTensor\n"
        "{output.out} = ToTensor()"
    ),
}
