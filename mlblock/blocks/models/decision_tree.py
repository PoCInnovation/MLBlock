from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    task = params.get("task", "classification")
    X = data.drop(target, axis=1)
    y = data[target]
    max_depth = params.get("max_depth")
    if task == "classification":
        model = DecisionTreeClassifier(max_depth=max_depth)
    else:
        model = DecisionTreeRegressor(max_depth=max_depth)
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "if '{params.task}' == 'classification':\n"
    "    {output.model} = DecisionTreeClassifier(max_depth={params.max_depth})"
    ".fit(X_train_{node_id}, y_train_{node_id})\n"
    "else:\n"
    "    {output.model} = DecisionTreeRegressor(max_depth={params.max_depth})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "Decision Tree",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "task": {"type": "str", "default": "classification"},
        "max_depth": {"type": "int", "default": None},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
