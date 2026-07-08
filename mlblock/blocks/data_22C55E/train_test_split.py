from sklearn.model_selection import train_test_split as _split


def BUILD(params):
    data = params["_inputs"].get("dataset")
    ratio = params.get("ratio", 0.8)
    shuffle = params.get("shuffle", True)
    seed = params.get("seed")
    state = seed if seed is not None else None
    train, test = _split(data, train_size=ratio, shuffle=shuffle, random_state=state)
    return {"train": train, "test": test}


BLOCK = {
    "label": "Séparer train/test",
    "category": "data",
    "params": {
        "ratio": {"type": "float", "default": 0.8},
        "shuffle": {"type": "bool", "default": True},
        "seed": {"type": "int", "default": None},
    },
    "inputs": [{"name": "dataset", "dtype": "DataFrame"}],
    "outputs": [
        {"name": "train", "dtype": "DataFrame"},
        {"name": "test", "dtype": "DataFrame"},
    ],
    "template": (
        "from sklearn.model_selection import train_test_split\n"
        "{output.train}, {output.test} = train_test_split(\n"
        "  {input.dataset}, train_size={params.ratio}, shuffle={params.shuffle}"
        "{', random_state=' + str(params.seed) if params.seed is not None else ''})"
    ),
}
