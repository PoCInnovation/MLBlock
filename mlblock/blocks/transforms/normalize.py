from torchvision.transforms import Normalize as _Normalize


def BUILD(params):
    return _Normalize(mean=params["mean"], std=params["std"])


BLOCK = {
    "label": "Normalize",
    "category": "transform",
    "params": {
        "mean": {"type": "list", "required": True},
        "std": {"type": "list", "required": True},
    },
    "inputs": [{"name": "in", "dtype": "Tensor"}],
    "outputs": [{"name": "out", "dtype": "Tensor"}],
    "template": (
        "from torchvision.transforms import Normalize\n"
        "{output.out} = Normalize(mean={params.mean}, std={params.std})"
    ),
}
