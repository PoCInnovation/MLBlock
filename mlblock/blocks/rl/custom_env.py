from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Environnement personnalisé",
    category="environment",
    params={
        "env_name": ParamSpec(
            type="str",
            default="CustomEnv",
            description="Nom de la classe",
        ),
        "render_mode": ParamSpec(type="str", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template="",
    children_allowed=True,
    generates_class="CustomEnv",
    class_base="gym.Env",
)
