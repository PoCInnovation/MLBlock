from torch import nn


def BUILD(params):
    return nn.BatchNorm1d(num_features=params["num_features"])


BLOCK = {
    "label": "BatchNorm1D",
    "category": "neural",
    "params": {
        "num_features": {"type": "int", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.BatchNorm1d({params.num_features})"
    ),
}
