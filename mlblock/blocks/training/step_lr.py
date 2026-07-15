from torch import optim


def BUILD(params):
    optimizer = params["_inputs"].get("optimizer")
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    return {
        "scheduler": optim.lr_scheduler.StepLR(
            optimizer,
            step_size=params.get("step_size", 30),
            gamma=params.get("gamma", 0.1),
        )
    }


BLOCK = {
    "label": "StepLR",
    "category": "training",
    "params": {
        "step_size": {"type": "int", "default": 30},
        "gamma": {"type": "float", "default": 0.1},
    },
    "inputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "outputs": [{"name": "scheduler", "dtype": "Scheduler"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.scheduler} = optim.lr_scheduler.StepLR("
        "{input.optimizer}, step_size={params.step_size}, gamma={params.gamma})"
    ),
}
