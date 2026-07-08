from stable_baselines3.common.evaluation import evaluate_policy


def BUILD(params):
    model = params["_inputs"]["model"]
    env = params["_inputs"]["env"]
    mean_reward, std_reward = evaluate_policy(
        model, env, n_eval_episodes=params.get("n_episodes", 10),
    )
    return {"mean_reward": mean_reward}


_TEMPLATE = (
    "from stable_baselines3.common.evaluation import evaluate_policy\n"
    "mean_reward_{node_id}, std_reward_{node_id} = evaluate_policy(\n"
    "    {input.model}, {input.env}, n_eval_episodes={params.n_episodes})\n"
    "{output.mean_reward} = mean_reward_{node_id}\n"
    "print(f'Evaluation - Recompense moyenne: {mean_reward_{node_id}:.2f} +/- {std_reward_{node_id}:.2f}')\n"
    "{plot_code}"
)

BLOCK = {
    "label": "Évaluer un agent RL",
    "category": "rl",
    "params": {
        "n_episodes": {"type": "int", "default": 10},
        "render": {"type": "bool", "default": False},
        "plot_rewards": {"type": "bool", "default": True},
    },
    "inputs": [
        {"name": "model", "dtype": "RLModel"},
        {"name": "env", "dtype": "Environment"},
    ],
    "outputs": [{"name": "mean_reward", "dtype": "float"}],
    "template": _TEMPLATE,
}
