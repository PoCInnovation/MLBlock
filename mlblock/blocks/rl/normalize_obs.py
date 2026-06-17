from stable_baselines3.common.vec_env import VecNormalize


def BUILD(params):
    env = params["_inputs"]["env"]
    return {
        "env": VecNormalize(
            env,
            norm_obs=params.get("norm_obs", True),
            norm_reward=params.get("norm_reward", False),
        )
    }


BLOCK = {
    "label": "Normaliser l'environnement",
    "category": "environment",
    "params": {
        "norm_obs": {"type": "bool", "default": True},
        "norm_reward": {"type": "bool", "default": False},
    },
    "inputs": [{"name": "env", "dtype": "Environment"}],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "from stable_baselines3.common.vec_env import VecNormalize\n"
        "{output.env} = VecNormalize({input.env}, "
        "norm_obs={params.norm_obs}, norm_reward={params.norm_reward})"
    ),
}
