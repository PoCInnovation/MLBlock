from torch import nn


def BUILD(params):
    return nn.Sigmoid()


BLOCK = {
    "label": "Sigmoid",
    "category": "neural",
    "params": {},
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Sigmoid()"
    ),
}
