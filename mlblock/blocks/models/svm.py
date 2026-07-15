from sklearn.svm import SVC, SVR


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    task = params.get("task", "classification")
    X = data.drop(target, axis=1)
    y = data[target]
    kernel = params.get("kernel", "rbf")
    C = params.get("C", 1.0)
    if task == "classification":
        model = SVC(kernel=kernel, C=C)
    else:
        model = SVR(kernel=kernel, C=C)
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.svm import SVC, SVR\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "if '{params.task}' == 'classification':\n"
    "    {output.model} = SVC(kernel='{params.kernel}', C={params.C})"
    ".fit(X_train_{node_id}, y_train_{node_id})\n"
    "else:\n"
    "    {output.model} = SVR(kernel='{params.kernel}', C={params.C})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "SVM",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "task": {"type": "str", "default": "classification"},
        "kernel": {"type": "str", "default": "rbf"},
        "C": {"type": "float", "default": 1.0},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
