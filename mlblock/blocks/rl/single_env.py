from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Créer un environnement simple",
    category="environment",
    params={
        "env_id": ParamSpec(
            type="str",
            required=True,
            description="ID Gymnasium (ex: CartPole-v1)",
        ),
        "render_mode": ParamSpec(
            type="str",
            default=None,
            description="human, rgb_array, None",
        ),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "import gymnasium as gym\n"
        "{output.env} = gym.make({params.env_id}"
        "{', render_mode=\"' + params.render_mode + '\"' if params.render_mode else ''})"
    ),
)
