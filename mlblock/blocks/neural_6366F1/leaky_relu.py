from torch import nn


def BUILD(params):
    return nn.LeakyReLU(negative_slope=params.get("negative_slope", 0.01))


BLOCK = {
    "label": "LeakyReLU",
    "category": "neural",
    "params": {
        "negative_slope": {"type": "float", "default": 0.01},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.LeakyReLU(negative_slope={params.negative_slope})"
    ),
}
