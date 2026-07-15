from torch.utils.data import DataLoader as _DataLoader


def BUILD(params):
    dataset = params["_inputs"].get("dataset")
    if isinstance(dataset, dict):
        dataset = list(dataset.values())[0]
    return {
        "dataloader": _DataLoader(
            dataset,
            batch_size=params.get("batch_size", 32),
            shuffle=params.get("shuffle", True),
            num_workers=params.get("num_workers", 0),
        )
    }


BLOCK = {
    "label": "DataLoader",
    "category": "data",
    "params": {
        "batch_size": {"type": "int", "default": 32},
        "shuffle": {"type": "bool", "default": True},
        "num_workers": {"type": "int", "default": 0},
    },
    "inputs": [{"name": "dataset", "dtype": "Dataset"}],
    "outputs": [{"name": "dataloader", "dtype": "DataLoader"}],
    "template": (
        "from torch.utils.data import DataLoader\n"
        "{output.dataloader} = DataLoader({input.dataset}, "
        "batch_size={params.batch_size}, shuffle={params.shuffle}, "
        "num_workers={params.num_workers})"
    ),
}
