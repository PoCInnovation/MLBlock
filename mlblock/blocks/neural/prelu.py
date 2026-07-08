from torch import nn


def BUILD(params):
    return nn.PReLU(num_parameters=params.get("num_parameters", 1))


BLOCK = {
    "label": "PReLU",
    "category": "neural",
    "params": {
        "num_parameters": {"type": "int", "default": 1},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.PReLU(num_parameters={params.num_parameters})"
    ),
}
