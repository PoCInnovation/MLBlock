from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Définir un espace",
    category="environment",
    params={
        "space_type": ParamSpec(
            type="str",
            default="Discrete",
            description="Discrete, Box, MultiBinary, MultiDiscrete",
        ),
        "n": ParamSpec(
            type="int",
            default=None,
            description="Discrete/MultiBinary: nombre",
        ),
        "low": ParamSpec(
            type="str",
            default=None,
            description="Box: valeurs min (JSON list, ex: [-1.0])",
        ),
        "high": ParamSpec(
            type="str",
            default=None,
            description="Box: valeurs max (JSON list, ex: [1.0])",
        ),
        "dtype": ParamSpec(
            type="str",
            default="float32",
            description="Type numpy pour Box",
        ),
    },
    inputs=[],
    outputs=[PortSpec(name="space", dtype="Space")],
    template="{space_expr}",
)
