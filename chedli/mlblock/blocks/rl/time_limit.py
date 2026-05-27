from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Limiter la durée d'épisode",
    category="environment",
    params={
        "max_episode_steps": ParamSpec(type="int", default=500),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from gymnasium.wrappers import TimeLimit\n"
        "{output.env} = TimeLimit({input.env}, "
        "max_episode_steps={params.max_episode_steps})"
    ),
)
