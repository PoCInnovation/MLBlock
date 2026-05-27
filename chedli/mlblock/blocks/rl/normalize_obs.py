from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Normaliser l'environnement",
    category="environment",
    params={
        "norm_obs": ParamSpec(type="bool", default=True),
        "norm_reward": ParamSpec(type="bool", default=False),
    },
    inputs=[PortSpec(name="env", dtype="Environment")],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.vec_env import VecNormalize\n"
        "{output.env} = VecNormalize({input.env}, "
        "norm_obs={params.norm_obs}, norm_reward={params.norm_reward})"
    ),
)
