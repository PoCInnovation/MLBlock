from sklearn.decomposition import PCA as _PCA


def BUILD(params):
    data = params["_inputs"].get("data")
    X = data.drop(params.get("target_column"), axis=1) if params.get("target_column") and params["target_column"] in data.columns else data
    n_components = params.get("n_components", 2)
    model = _PCA(n_components=n_components)
    transformed = model.fit_transform(X)
    return {"model": model, "transformed": transformed}


_TEMPLATE = (
    "from sklearn.decomposition import PCA\n"
    "X_pca_{node_id} = {input.data}\n"
    "if '{params.target_column}' in X_pca_{node_id}.columns:\n"
    "    X_pca_{node_id} = X_pca_{node_id}.drop('{params.target_column}', axis=1)\n"
    "{output.model} = PCA(n_components={params.n_components})\n"
    "{output.transformed} = {output.model}.fit_transform(X_pca_{node_id})"
)

BLOCK = {
    "label": "PCA",
    "category": "models",
    "params": {
        "n_components": {"type": "int", "default": 2},
        "target_column": {"type": "str", "default": None},
    },
    "inputs": [{"name": "data", "dtype": "DataFrame"}],
    "outputs": [
        {"name": "model", "dtype": "Model"},
        {"name": "transformed", "dtype": "DataFrame"},
    ],
    "template": _TEMPLATE,
}
