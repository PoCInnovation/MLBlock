from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "from sklearn.linear_model import LinearRegression\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = LinearRegression(fit_intercept={params.fit_intercept})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = BlockSpec(
    label="Régression linéaire",
    category="models",
    params={
        "target_column": ParamSpec(
            type="str",
            required=True,
            description="Nom de la colonne cible",
        ),
        "fit_intercept": ParamSpec(type="bool", default=True),
    },
    inputs=[PortSpec(name="train_data", dtype="DataFrame")],
    outputs=[PortSpec(name="model", dtype="Model")],
    template=_TEMPLATE,
)
