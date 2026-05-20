from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "from sklearn.ensemble import RandomForestClassifier\n"
    "X_train_{node_id} = {input.train_data}.drop({params.target_column}, axis=1)\n"
    "y_train_{node_id} = {input.train_data}[{params.target_column}]\n"
    "{output.model} = RandomForestClassifier(n_estimators={params.n_estimators}"
    "{', max_depth=' + str(params.max_depth) if params.max_depth is not None else ''})"
    ".fit(X_train_{node_id}, y_train_{node_id})"
)

BLOCK = BlockSpec(
    label="Random Forest",
    category="models",
    params={
        "target_column": ParamSpec(
            type="str",
            required=True,
            description="Nom de la colonne cible",
        ),
        "n_estimators": ParamSpec(type="int", default=100),
        "max_depth": ParamSpec(type="int", default=None),
    },
    inputs=[PortSpec(name="train_data", dtype="DataFrame")],
    outputs=[PortSpec(name="model", dtype="Model")],
    template=_TEMPLATE,
)
