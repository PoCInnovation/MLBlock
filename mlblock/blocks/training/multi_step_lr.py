from torch import optim


def BUILD(params):
    optimizer = params["_inputs"].get("optimizer")
    if isinstance(optimizer, dict):
        optimizer = list(optimizer.values())[0]
    milestones = params.get("milestones", [30, 60, 90])
    return {
        "scheduler": optim.lr_scheduler.MultiStepLR(
            optimizer,
            milestones=milestones,
            gamma=params.get("gamma", 0.1),
        )
    }


BLOCK = {
    "label": "MultiStepLR",
    "category": "training",
    "params": {
        "milestones": {"type": "list", "default": [30, 60, 90]},
        "gamma": {"type": "float", "default": 0.1},
    },
    "inputs": [{"name": "optimizer", "dtype": "Optimizer"}],
    "outputs": [{"name": "scheduler", "dtype": "Scheduler"}],
    "template": (
        "import torch.optim as optim\n"
        "{output.scheduler} = optim.lr_scheduler.MultiStepLR("
        "{input.optimizer}, milestones={params.milestones}, gamma={params.gamma})"
    ),
}
