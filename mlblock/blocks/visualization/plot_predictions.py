import matplotlib.pyplot as plt


def BUILD(params):
    test_data = params["_inputs"]["test_data"]
    model = params["_inputs"]["model"]
    target = params["target_column"]
    X_test = test_data.drop(target, axis=1)
    y_test = test_data[target]
    y_pred = model.predict(X_test)
    plt.scatter(y_test, y_pred, alpha=0.5)
    plt.xlabel('Vraies valeurs')
    plt.ylabel('Prédictions')
    plt.title('Prédictions vs Réelles')
    path = params.get("output_path", "predictions.png")
    plt.savefig(path)
    plt.close()
    return {}


_TEMPLATE = (
    "import matplotlib.pyplot as plt\n"
    "X_test_{node_id} = {input.test_data}.drop({params.target_column}, axis=1)\n"
    "y_test_{node_id} = {input.test_data}[{params.target_column}]\n"
    "y_pred_{node_id} = {input.model}.predict(X_test_{node_id})\n"
    "plt.scatter(y_test_{node_id}, y_pred_{node_id}, alpha=0.5)\n"
    "plt.xlabel('Vraies valeurs')\n"
    "plt.ylabel('Prédictions')\n"
    "plt.title('Prédictions vs Réelles')\n"
    "plt.savefig({params.output_path})\n"
    "plt.close()\n"
    "print('Graphique sauvegardé: ' + str({params.output_path}))"
)

BLOCK = {
    "label": "Graphique prédictions vs réelles",
    "category": "visualization",
    "params": {
        "target_column": {"type": "str", "required": True},
        "output_path": {"type": "str", "default": "predictions.png"},
    },
    "inputs": [
        {"name": "model", "dtype": "Model"},
        {"name": "test_data", "dtype": "DataFrame"},
    ],
    "outputs": [],
    "template": _TEMPLATE,
}
