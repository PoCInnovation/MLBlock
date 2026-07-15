from sklearn.preprocessing import StandardScaler as _StandardScaler


def BUILD(params):
    data = params["_inputs"].get("data")
    X = data.drop(params.get("target_column"), axis=1) if params.get("target_column") and params["target_column"] in data.columns else data
    scaler = _StandardScaler()
    scaled = scaler.fit_transform(X)
    return {"scaler": scaler, "scaled": scaled}


_TEMPLATE = (
    "from sklearn.preprocessing import StandardScaler\n"
    "X_scaler_{node_id} = {input.data}\n"
    "if '{params.target_column}' in X_scaler_{node_id}.columns:\n"
    "    X_scaler_{node_id} = X_scaler_{node_id}.drop('{params.target_column}', axis=1)\n"
    "{output.scaler} = StandardScaler()\n"
    "{output.scaled} = {output.scaler}.fit_transform(X_scaler_{node_id})"
)

BLOCK = {
    "label": "StandardScaler",
    "category": "models",
    "params": {
        "target_column": {"type": "str", "default": None},
    },
    "inputs": [{"name": "data", "dtype": "DataFrame"}],
    "outputs": [
        {"name": "scaler", "dtype": "Model"},
        {"name": "scaled", "dtype": "DataFrame"},
    ],
    "template": _TEMPLATE,
}
