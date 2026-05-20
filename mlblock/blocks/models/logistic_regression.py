from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "from sklearn.linear_model import LogisticRegression\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = LogisticRegression(max_iter={params.max_iter})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = BlockSpec(
    label="Régression logistique",
    category="models",
    params={
        "target_column": ParamSpec(
            type="str",
            required=True,
            description="Nom de la colonne cible",
        ),
        "max_iter": ParamSpec(type="int", default=1000),
    },
    inputs=[PortSpec(name="train_data", dtype="DataFrame")],
    outputs=[PortSpec(name="model", dtype="Model")],
    template=_TEMPLATE,
)
