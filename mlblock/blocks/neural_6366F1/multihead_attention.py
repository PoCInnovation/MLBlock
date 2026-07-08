from torch import nn


def BUILD(params):
    return nn.MultiheadAttention(
        embed_dim=params["embed_dim"],
        num_heads=params["num_heads"],
        dropout=params.get("dropout", 0.0),
        bias=params.get("bias", True),
        batch_first=params.get("batch_first", True),
    )


BLOCK = {
    "label": "MultiheadAttention",
    "category": "neural",
    "params": {
        "embed_dim": {"type": "int", "required": True},
        "num_heads": {"type": "int", "required": True},
        "dropout": {"type": "float", "default": 0.0},
        "bias": {"type": "bool", "default": True},
        "batch_first": {"type": "bool", "default": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.MultiheadAttention(\n"
        "    embed_dim={params.embed_dim},\n"
        "    num_heads={params.num_heads},\n"
        "    dropout={params.dropout},\n"
        "    bias={params.bias},\n"
        "    batch_first={params.batch_first})"
    ),
}
