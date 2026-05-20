from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Empiler les frames",
    category="environment",
    params={
        "n_stack": ParamSpec(
            type="int",
            default=4,
            description="Nombre de frames à empiler",
        ),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.vec_env import VecFrameStack\n"
        "{output.env} = VecFrameStack({input.env}, n_stack={params.n_stack})"
    ),
)
