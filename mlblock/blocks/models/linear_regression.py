from sklearn.linear_model import LinearRegression


def BUILD(params):
    data = params["_inputs"].get("train_data")
    target = params["target_column"]
    X = data.drop(target, axis=1)
    y = data[target]
    model = LinearRegression(fit_intercept=params.get("fit_intercept", True))
    model.fit(X, y)
    return {"model": model}


_TEMPLATE = (
    "from sklearn.linear_model import LinearRegression\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = LinearRegression(fit_intercept={params.fit_intercept})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = {
    "label": "Régression linéaire",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "required": True},
        "fit_intercept": {"type": "bool", "default": True},
    },
    "inputs": [{"name": "train_data", "dtype": "DataFrame"}],
    "outputs": [{"name": "model", "dtype": "Model"}],
    "template": _TEMPLATE,
}
