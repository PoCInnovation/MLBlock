from torch import nn


def BUILD(params):
    return nn.InstanceNorm2d(num_features=params["num_features"])


BLOCK = {
    "label": "InstanceNorm2D",
    "category": "neural",
    "params": {
        "num_features": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.InstanceNorm2d({params.num_features})"
    ),
}
