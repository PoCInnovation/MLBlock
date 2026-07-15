from torch.utils.data import random_split as _random_split


def BUILD(params):
    dataset = params["_inputs"].get("dataset")
    if isinstance(dataset, dict):
        dataset = list(dataset.values())[0]
    train_len = params.get("train_ratio", 0.8)
    total = len(dataset)
    train_size = int(total * train_len)
    test_size = total - train_size
    train_ds, test_ds = _random_split(dataset, [train_size, test_size])
    return {"train": train_ds, "test": test_ds}


BLOCK = {
    "label": "Random Split",
    "category": "data",
    "params": {
        "train_ratio": {"type": "float", "default": 0.8},
    },
    "inputs": [{"name": "dataset", "dtype": "Dataset"}],
    "outputs": [
        {"name": "train", "dtype": "Dataset"},
        {"name": "test", "dtype": "Dataset"},
    ],
    "template": (
        "from torch.utils.data import random_split\n"
        "total_{node_id} = len({input.dataset})\n"
        "train_size_{node_id} = int(total_{node_id} * {params.train_ratio})\n"
        "test_size_{node_id} = total_{node_id} - train_size_{node_id}\n"
        "{output.train}, {output.test} = random_split({input.dataset}, "
        "[train_size_{node_id}, test_size_{node_id}])"
    ),
}
