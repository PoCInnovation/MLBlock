from torch import nn


def BUILD(params):
    return nn.AvgPool2d(kernel_size=params.get("kernel_size", 2))


BLOCK = {
    "label": "AvgPool2D",
    "category": "neural",
    "params": {
        "kernel_size": {"type": "int", "default": 2},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.AvgPool2d(kernel_size={params.kernel_size})"
    ),
}
