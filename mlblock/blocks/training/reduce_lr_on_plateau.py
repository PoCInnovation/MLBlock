from torch import optim


def BUILD(params):
    optimizer = params["_inputs"].get("optimizer")
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    return {
        "scheduler": optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode=params.get("mode", "min"),
            factor=params.get("factor", 0.1),
            patience=params.get("patience", 10),
        )
    }


BLOCK = {
    "label": "ReduceLROnPlateau",
    "category": "training",
    "params": {
        "mode": {"type": "str", "default": "min"},
        "factor": {"type": "float", "default": 0.1},
        "patience": {"type": "int", "default": 10},
    },
    "inputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "outputs": [{"name": "scheduler", "dtype": "Scheduler"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.scheduler} = optim.lr_scheduler.ReduceLROnPlateau("
        "{input.optimizer}, mode='{params.mode}', factor={params.factor}, "
        "patience={params.patience})"
    ),
}
