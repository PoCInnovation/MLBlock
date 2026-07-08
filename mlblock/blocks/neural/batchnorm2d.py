from torch import nn


def BUILD(params):
    return nn.BatchNorm2d(num_features=params["num_features"])


BLOCK = {
    "label": "BatchNorm2D",
    "category": "neural",
    "params": {
        "num_features": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.BatchNorm2d({params.num_features})"
    ),
}
