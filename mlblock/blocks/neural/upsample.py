from torch import nn


def BUILD(params):
    return nn.Upsample(
        scale_factor=params.get("scale_factor"),
        mode=params.get("mode", "nearest"),
    )


BLOCK = {
    "label": "Upsample",
    "category": "neural",
    "params": {
        "scale_factor": {"type": "int", "default": None},
        "mode": {"type": "str", "default": "nearest"},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.Upsample(scale_factor={params.scale_factor}, "
        "mode='{params.mode}')"
    ),
}
