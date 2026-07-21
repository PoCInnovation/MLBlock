from torch import optim


def BUILD(params):
    optimizer = params["_inputs"].get("optimizer")
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    return {
        "scheduler": optim.lr_scheduler.ExponentialLR(
            optimizer,
            gamma=params.get("gamma", 0.9),
        )
    }


BLOCK = {
    "label": "ExponentialLR",
    "category": "training",
    "params": {
        "gamma": {"type": "float", "default": 0.9},
    },
    "inputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "outputs": [{"name": "scheduler", "dtype": "Scheduler"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.scheduler} = optim.lr_scheduler.ExponentialLR("
        "{input.optimizer}, gamma={params.gamma})"
    ),
}
