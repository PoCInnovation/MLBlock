from stable_baselines3.common.env_util import make_vec_env


def BUILD(params):
    env = make_vec_env(
        params["env_id"],
        n_envs=params.get("n_envs", 4),
        seed=params.get("seed"),
    )
    return {"env": env}


BLOCK = {
    "label": "Créer un environnement Gymnasium",
    "category": "environment",
    "params": {
        "env_id": {"type": "str", "required": True},
        "n_envs": {"type": "int", "default": 4},
        "seed": {"type": "int", "default": None},
    },
    "inputs": [],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "from stable_baselines3.common.env_util import make_vec_env\n"
        "{output.env} = make_vec_env({params.env_id}, n_envs={params.n_envs}"
        "{', seed=' + str(params.seed) if params.seed is not None else ''})"
    ),
}
