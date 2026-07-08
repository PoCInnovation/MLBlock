from torch import nn


def BUILD(params):
    lstm = nn.LSTM(
        input_size=params["input_size"],
        hidden_size=params["hidden_size"],
        num_layers=params.get("num_layers", 1),
        bias=params.get("bias", True),
        batch_first=params.get("batch_first", True),
        dropout=params.get("dropout", 0.0),
        bidirectional=params.get("bidirectional", False),
    )
    return lstm


BLOCK = {
    "label": "LSTM",
    "category": "neural",
    "params": {
        "input_size": {"type": "int", "required": True},
        "hidden_size": {"type": "int", "required": True},
        "num_layers": {"type": "int", "default": 1},
        "bias": {"type": "bool", "default": True},
        "batch_first": {"type": "bool", "default": True},
        "dropout": {"type": "float", "default": 0.0},
        "bidirectional": {"type": "bool", "default": False},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "import torch.nn as nn\n"
        "{output.out} = nn.LSTM(\n"
        "    input_size={params.input_size},\n"
        "    hidden_size={params.hidden_size},\n"
        "    num_layers={params.num_layers},\n"
        "    bias={params.bias},\n"
        "    batch_first={params.batch_first},\n"
        "    dropout={params.dropout},\n"
        "    bidirectional={params.bidirectional})"
    ),
}
