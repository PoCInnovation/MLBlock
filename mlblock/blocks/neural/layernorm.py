from torch import nn


def BUILD(params):
    return nn.LayerNorm(normalized_shape=params["normalized_shape"])


BLOCK = {
    "label": "LayerNorm",
    "category": "neural",
    "params": {
        "normalized_shape": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.LayerNorm({params.normalized_shape})"
    ),
}
