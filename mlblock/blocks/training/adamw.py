from torch import optim


def BUILD(params):
    model = params["_inputs"].get("model")
    if isinstance(model, dict):
        model = list(model.values())[0]
    return {
        "optimizer": optim.AdamW(
            model.parameters(),
            lr=params.get("lr", 0.001),
            weight_decay=params.get("weight_decay", 0.01),
        )
    }


BLOCK = {
    "label": "AdamW Optimizer",
    "category": "training",
    "params": {
        "lr": {"type": "float", "default": 0.001},
        "weight_decay": {"type": "float", "default": 0.01},
    },
    "inputs": [{"name": "model", "dtype": "Module"}],
    "outputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.optimizer} = optim.AdamW({input.model}.parameters(), "
        "lr={params.lr}, weight_decay={params.weight_decay})"
    ),
}
