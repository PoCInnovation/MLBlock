from torch import nn


def BUILD(params):
    return nn.Linear(
        in_features=params["in_features"],
        out_features=params["out_features"],
        bias=params.get("bias", True),
    )


BLOCK = {
    "label": "Linear (FC)",
    "category": "neural",
    "params": {
        "in_features": {"type": "int", "required": True},
        "out_features": {"type": "int", "required": True},
        "bias": {"type": "bool", "default": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Linear({params.in_features}, {params.out_features}, bias={params.bias})"
    ),
}
