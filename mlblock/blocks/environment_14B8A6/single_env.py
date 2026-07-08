import gymnasium as gym


def BUILD(params):
    env = gym.make(
        params["env_id"],
        render_mode=params.get("render_mode"),
    )
    seed = params.get("seed")
    if seed is not None:
        env.reset(seed=seed)
    return {"env": env}


BLOCK = {
    "label": "Créer un environnement simple",
    "category": "environment",
    "params": {
        "env_id": {"type": "str", "required": True},
        "render_mode": {"type": "str", "default": None},
        "seed": {"type": "int", "default": None},
    },
    "inputs": [],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "import gymnasium as gym\n"
        "{output.env} = gym.make({params.env_id}"
        "{', render_mode=\"' + params.render_mode + '\"' if params.render_mode else ''})"
    ),
}
