from torch import nn


def BUILD(params):
    return nn.Softmax(dim=params.get("dim", 1))


BLOCK = {
    "label": "Softmax",
    "category": "neural",
    "params": {
        "dim": {"type": "int", "default": 1},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Softmax(dim={params.dim})"
    ),
}
