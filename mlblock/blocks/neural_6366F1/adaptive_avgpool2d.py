from torch import nn


def BUILD(params):
    return nn.AdaptiveAvgPool2d(output_size=params.get("output_size", 1))


BLOCK = {
    "label": "AdaptiveAvgPool2D",
    "category": "neural",
    "params": {
        "output_size": {"type": "int", "default": 1},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.AdaptiveAvgPool2d(output_size={params.output_size})"
    ),
}
