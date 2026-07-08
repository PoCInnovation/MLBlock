from gymnasium.wrappers import TimeLimit


def BUILD(params):
    env = params["_inputs"]["env"]
    return {"env": TimeLimit(env, max_episode_steps=params.get("max_episode_steps", 500))}


BLOCK = {
    "label": "Limiter la durée d'épisode",
    "category": "environment",
    "params": {
        "max_episode_steps": {"type": "int", "default": 500},
    },
    "inputs": [{"name": "env", "dtype": "Environment"}],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "from gymnasium.wrappers import TimeLimit\n"
        "{output.env} = TimeLimit({input.env}, "
        "max_episode_steps={params.max_episode_steps})"
    ),
}
