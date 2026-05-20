from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Code personnalisé",
    category="advanced",
    params={
        "code": ParamSpec(
            type="str",
            required=True,
            description="Code Python à injecter",
        ),
        "exec_location": ParamSpec(
            type="str",
            default="inline",
            description="inline, init, reset, step, reward",
        ),
    },
    inputs=[],
    outputs=[],
    template="{params.code}",
)
