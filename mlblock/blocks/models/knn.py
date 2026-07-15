from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    task = params.get("task", "classification")
    X = data.drop(target, axis=1)
    y = data[target]
    n_neighbors = params.get("n_neighbors", 5)
    if task == "classification":
        model = KNeighborsClassifier(n_neighbors=n_neighbors)
    else:
        model = KNeighborsRegressor(n_neighbors=n_neighbors)
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "if '{params.task}' == 'classification':\n"
    "    {output.model} = KNeighborsClassifier(n_neighbors={params.n_neighbors})"
    ".fit(X_train_{node_id}, y_train_{node_id})\n"
    "else:\n"
    "    {output.model} = KNeighborsRegressor(n_neighbors={params.n_neighbors})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "KNN",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "task": {"type": "str", "default": "classification"},
        "n_neighbors": {"type": "int", "default": 5},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
