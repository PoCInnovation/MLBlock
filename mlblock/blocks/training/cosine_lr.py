from torch import optim


def BUILD(params):
    optimizer = params["_inputs"].get("optimizer")
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    return {
        "scheduler": optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=params.get("T_max", 100),
            eta_min=params.get("eta_min", 0.0),
        )
    }


BLOCK = {
    "label": "CosineAnnealingLR",
    "category": "training",
    "params": {
        "T_max": {"type": "int", "default": 100},
        "eta_min": {"type": "float", "default": 0.0},
    },
    "inputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "outputs": [{"name": "scheduler", "dtype": "Scheduler"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.scheduler} = optim.lr_scheduler.CosineAnnealingLR("
        "{input.optimizer}, T_max={params.T_max}, eta_min={params.eta_min})"
    ),
}
