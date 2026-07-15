from torch import nn


def BUILD(params):
    return nn.CrossEntropyLoss()


BLOCK = {
    "label": "CrossEntropyLoss",
    "category": "training",
    "params": {},
    "inputs": [],
    "outputs": [{"name": "loss_fn", "dtype": "Loss"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.loss_fn} = nn.CrossEntropyLoss()"
    ),
}
