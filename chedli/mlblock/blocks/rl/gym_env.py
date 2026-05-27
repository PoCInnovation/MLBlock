from chedli.mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

BLOCK = BlockSpec(
    label="Créer un environnement Gymnasium",
    category="environment",
    params={
        "env_id": ParamSpec(
            type="str",
            required=True,
            description="ID Gymnasium (ex: CartPole-v1, LunarLander-v3)",
        ),
        "n_envs": ParamSpec(
            type="int",
            default=4,
            description="Nombre d'environnements parallèles",
        ),
        "seed": ParamSpec(type="int", default=None),
    },
    inputs=[],
    outputs=[PortSpec(name="env", dtype="Environment")],
    template=(
        "from stable_baselines3.common.env_util import make_vec_env\n"
        "{output.env} = make_vec_env({params.env_id}, n_envs={params.n_envs}"
        "{', seed=' + str(params.seed) if params.seed is not None else ''})"
    ),
)
