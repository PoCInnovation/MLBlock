from stable_baselines3.common.vec_env import VecFrameStack


def BUILD(params):
    env = params["_inputs"]["env"]
    return {"env": VecFrameStack(env, n_stack=params.get("n_stack", 4))}


BLOCK = {
    "label": "Empiler les frames",
    "category": "environment",
    "params": {
        "n_stack": {"type": "int", "default": 4},
    },
    "inputs": [{"name": "env", "dtype": "Environment"}],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": (
        "from stable_baselines3.common.vec_env import VecFrameStack\n"
        "{output.env} = VecFrameStack({input.env}, n_stack={params.n_stack})"
    ),
}
