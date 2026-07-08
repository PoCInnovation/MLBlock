from sklearn.ensemble import RandomForestClassifier


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    X = data.drop(target, axis=1)
    y = data[target]
    max_depth = params.get("max_depth")
    model = RandomForestClassifier(
        n_estimators=params.get("n_estimators", 100),
        max_depth=max_depth,
    )
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.ensemble import RandomForestClassifier\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = RandomForestClassifier(n_estimators={params.n_estimators}"
    "{', max_depth=' + str(params.max_depth) if params.max_depth is not None else ''})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "Random Forest",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "n_estimators": {"type": "int", "default": 100},
        "max_depth": {"type": "int", "default": None},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
