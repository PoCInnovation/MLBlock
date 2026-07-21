from torch import nn


def BUILD(params):
    return nn.SmoothL1Loss()


BLOCK = {
    "label": "SmoothL1Loss",
    "category": "training",
    "params": {},
    "inputs": [],
    "outputs": [{"name": "loss_fn", "dtype": "Loss"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.loss_fn} = nn.SmoothL1Loss()"
    ),
}
