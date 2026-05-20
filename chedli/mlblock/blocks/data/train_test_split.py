from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Séparer train/test",
    category="data",
    params={
        "ratio": ParamSpec(
            type="float",
            default=0.8,
            description="Proportion des données d'entraînement",
        ),
        "shuffle": ParamSpec(type="bool", default=True),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[PortSpec(name="dataset", dtype="DataFrame")],
    outputs=[
        PortSpec(name="train", dtype="DataFrame"),
        PortSpec(name="test", dtype="DataFrame"),
    ],
    template=(
        "from sklearn.model_selection import train_test_split\n"
        "{output.train}, {output.test} = train_test_split(\n"
        "  {input.dataset}, train_size={params.ratio}, shuffle={params.shuffle}"
        "{', random_state=' + str(params.seed) if params.seed is not None else ''})"
    ),
)
