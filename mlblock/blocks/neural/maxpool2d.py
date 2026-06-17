from torch import nn


def BUILD(params):
    return nn.MaxPool2d(
        kernel_size=params.get("kernel_size", 2),
        stride=params.get("stride", None),
    )


BLOCK = {
    "label": "MaxPool2D",
    "category": "neural",
    "params": {
        "kernel_size": {"type": "int", "default": 2},
        "stride": {"type": "int", "default": None},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.MaxPool2d(kernel_size={params.kernel_size})"
    ),
}
