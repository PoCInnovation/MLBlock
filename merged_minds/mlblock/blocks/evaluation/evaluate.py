from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

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

BLOCK = BlockSpec(
    label="Évaluer le modèle",
    category="evaluation",
    params={
        "target_column": ParamSpec(
            type="str",
            required=True,
            description="Nom de la colonne cible",
        ),
        "method": ParamSpec(
            type="str",
            default="mse",
            description="Metrique: mse, rmse, r2, mae",
        ),
        "plot": ParamSpec(
            type="bool",
            default=False,
            description="Generer un graphique predictions vs reelles",
        ),
    },
    inputs=[
        PortSpec(name="model", dtype="Model"),
        PortSpec(name="test_data", dtype="DataFrame"),
    ],
    outputs=[PortSpec(name="score", dtype="float")],
    template=_TEMPLATE,
)
