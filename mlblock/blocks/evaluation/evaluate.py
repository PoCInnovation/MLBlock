from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np
import math


def BUILD(params):
    test_data = params["_inputs"].get("test_data")
    model = params["_inputs"].get("model")
    target = params["target_column"]
    method = params.get("method", "mse")
    X_test = test_data.drop(target, axis=1)
    y_test = test_data[target]
    y_pred = model.predict(X_test)
    metrics = {
        "mse": mean_squared_error(y_test, y_pred),
        "rmse": math.sqrt(mean_squared_error(y_test, y_pred)),
        "r2": r2_score(y_test, y_pred),
        "mae": mean_absolute_error(y_test, y_pred),
    }
    return {"score": metrics.get(method, metrics["mse"])}


_TEMPLATE = (
    "from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error\n"
    "import numpy as np\n"
    "import math\n"
    "X_test_{node_id} = {input.test_data}.drop({params.target_column}, axis=1)\n"
    "y_test_{node_id} = {input.test_data}[{params.target_column}]\n"
    "y_pred_{node_id} = {input.model}.predict(X_test_{node_id})\n"
    "{output.score} = {metric_expr}\n"
    "print('Score (' + str({params.method}) + '): ' + str({output.score}))\n"
    "{plot_code}"
)

BLOCK = {
    "label": "Évaluer le modèle",
    "category": "evaluation",
    "params": {
        "target_column": {"type": "str", "required": True},
        "method": {"type": "str", "default": "mse"},
        "plot": {"type": "bool", "default": False},
    },
    "inputs": [
        {"name": "model", "dtype": "Model"},
        {"name": "test_data", "dtype": "DataFrame"},
    ],
    "outputs": [{"name": "score", "dtype": "float"}],
    "template": _TEMPLATE,
}
