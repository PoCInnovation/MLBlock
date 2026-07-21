from torch import optim


def BUILD(params):
    model = params["_inputs"].get("model")
    if isinstance(model, dict):
        model = list(model.values())[0]
    return {
        "optimizer": optim.RMSprop(
            model.parameters(),
            lr=params.get("lr", 0.01),
            momentum=params.get("momentum", 0.0),
            weight_decay=params.get("weight_decay", 0.0),
        )
    }


BLOCK = {
    "label": "RMSprop Optimizer",
    "category": "training",
    "params": {
        "lr": {"type": "float", "default": 0.01},
        "momentum": {"type": "float", "default": 0.0},
        "weight_decay": {"type": "float", "default": 0.0},
    },
    "inputs": [{"name": "model", "dtype": "Module"}],
    "outputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.optimizer} = optim.RMSprop({input.model}.parameters(), "
        "lr={params.lr}, momentum={params.momentum}, "
        "weight_decay={params.weight_decay})"
    ),
}
