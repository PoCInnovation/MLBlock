from torch import nn


def BUILD(params):
    return nn.L1Loss()


BLOCK = {
    "label": "L1Loss",
    "category": "training",
    "params": {},
    "inputs": [],
    "outputs": [{"name": "loss_fn", "dtype": "Loss"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.loss_fn} = nn.L1Loss()"
    ),
}
