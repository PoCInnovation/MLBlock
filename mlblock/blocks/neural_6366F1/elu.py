from torch import nn


def BUILD(params):
    return nn.ELU(alpha=params.get("alpha", 1.0))


BLOCK = {
    "label": "ELU",
    "category": "neural",
    "params": {
        "alpha": {"type": "float", "default": 1.0},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.ELU(alpha={params.alpha})"
    ),
}
