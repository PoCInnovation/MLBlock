from torch import nn


def BUILD(params):
    return nn.Flatten()


BLOCK = {
    "label": "Flatten",
    "category": "neural",
    "params": {},
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Flatten()"
    ),
}
