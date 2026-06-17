from sklearn.linear_model import LogisticRegression


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    X = data.drop(target, axis=1)
    y = data[target]
    model = LogisticRegression(max_iter=params.get("max_iter", 1000))
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.linear_model import LogisticRegression\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = LogisticRegression(max_iter={params.max_iter})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "Régression logistique",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "max_iter": {"type": "int", "default": 1000},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
