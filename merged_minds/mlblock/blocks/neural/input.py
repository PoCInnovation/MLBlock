from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Input",
    category="neural",
    params={
        "shape": ParamSpec(type="list[int]", required=True),
    },
    inputs=[],
    outputs=[PortSpec(name="out", dtype="Tensor")],
    template="",
)
