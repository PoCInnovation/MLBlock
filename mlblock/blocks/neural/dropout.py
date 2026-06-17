from torch import nn


def BUILD(params):
    return nn.Dropout(p=params.get("p", 0.5))


BLOCK = {
    "label": "Dropout",
    "category": "neural",
    "params": {
        "p": {"type": "float", "default": 0.5},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Dropout(p={params.p})"
    ),
}
