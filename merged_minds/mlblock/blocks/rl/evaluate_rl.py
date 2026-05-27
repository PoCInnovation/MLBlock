from mlblock.models.block_spec import BlockSpec, ParamSpec, PortSpec

_TEMPLATE = (
    "from stable_baselines3.common.evaluation import evaluate_policy\n"
    "mean_reward_{node_id}, std_reward_{node_id} = evaluate_policy(\n"
    "    {input.model}, {input.env}, n_eval_episodes={params.n_episodes})\n"
    "{output.mean_reward} = mean_reward_{node_id}\n"
    "print(f'Evaluation - Recompense moyenne: {mean_reward_{node_id}:.2f} +/- {std_reward_{node_id}:.2f}')\n"
    "{plot_code}"
)

BLOCK = BlockSpec(
    label="Évaluer un agent RL",
    category="rl",
    params={
        "n_episodes": ParamSpec(
            type="int",
            default=10,
            description="Nombre d'episodes d'evaluation",
        ),
        "render": ParamSpec(type="bool", default=False),
        "plot_rewards": ParamSpec(
            type="bool",
            default=True,
            description="Graphique des recompenses",
        ),
    },
    inputs=[
        PortSpec(name="model", dtype="RLModel"),
        PortSpec(name="env", dtype="Environment"),
    ],
    outputs=[PortSpec(name="mean_reward", dtype="float")],
    template=_TEMPLATE,
)
