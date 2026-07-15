from torch.utils.data import TensorDataset as _TensorDataset


def BUILD(params):
    features = params["_inputs"].get("features")
    labels = params["_inputs"].get("labels")
    if isinstance(features, dict):
        features = list(features.values())[0]
    if isinstance(labels, dict):
        labels = list(labels.values())[0]
    return {"dataset": _TensorDataset(features, labels)}


BLOCK = {
    "label": "TensorDataset",
    "category": "data",
    "params": {},
    "inputs": [
        {"name": "features", "dtype": "Tensor"},
        {"name": "labels", "dtype": "Tensor"},
    ],
    "outputs": [{"name": "dataset", "dtype": "Dataset"}],
    "template": (
        "from torch.utils.data import TensorDataset\n"
        "{output.dataset} = TensorDataset({input.features}, {input.labels})"
    ),
}
