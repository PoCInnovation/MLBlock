import torch


def BUILD(params):
    model = params["_inputs"].get("model")
    score = params["_inputs"].get("score")
    if isinstance(model, dict):
        model = list(model.values())[0]
    if isinstance(score, dict):
        score = list(score.values())[0]
    filepath = params.get("filepath", "model.pth")
    torch.save(model.state_dict(), filepath)
    print(f"Model saved to {filepath}")
    return {"path": filepath}


_TEMPLATE = (
    "import torch\n"
    "torch.save({input.model}.state_dict(), '{params.filepath}')\n"
    "print('Model saved to {params.filepath}')\n"
    "{output.path} = '{params.filepath}'"
)

BLOCK = {
    "label": "Model Checkpoint",
    "category": "training",
    "params": {
        "filepath": {"type": "str", "default": "model.pth"},
    },
    "inputs": [
        {"name": "model", "dtype": "Module"},
        {"name": "score", "dtype": "float"},
    ],
    "outputs": [{"name": "path", "dtype": "str"}],
    "template": _TEMPLATE,
}
