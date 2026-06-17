from stable_baselines3 import PPO, DQN, SAC, A2C, TD3
import torch


_ALGO_MAP = {
    "PPO": PPO,
    "DQN": DQN,
    "SAC": SAC,
    "A2C": A2C,
    "TD3": TD3,
}


def BUILD(params):
    algo_name = params.get("algorithm", "PPO")
    algo_cls = _ALGO_MAP.get(algo_name, PPO)
    env = params["_inputs"]["env"]
    algo = algo_cls(
        params.get("policy", "MlpPolicy"),
        env,
        learning_rate=params.get("learning_rate", 3e-4),
        gamma=params.get("gamma", 0.99),
        verbose=1,
        seed=params.get("seed"),
    )
    algo.learn(total_timesteps=params.get("total_timesteps", 100000))
    return {"model": algo}


_TEMPLATE = (
    "from stable_baselines3 import {raw_params.algorithm}\n"
    "import torch\n"
    "{output.model} = {raw_params.algorithm}(\n"
    "    {params.policy},\n"
    "    {input.env},\n"
    "    learning_rate={params.learning_rate},\n"
    "    gamma={params.gamma},\n"
    "    verbose=1\n"
    "{', seed=' + str(params.seed) if params.seed is not None else ''})\n"
    "{output.model}.learn(total_timesteps={params.total_timesteps})\n"
    "{output.model}.save('{raw_params.algorithm}_{node_id}')"
)

BLOCK = {
    "label": "Entraîner un agent RL",
    "category": "rl",
    "params": {
        "algorithm": {"type": "str", "default": "PPO"},
        "total_timesteps": {"type": "int", "default": 100000},
        "learning_rate": {"type": "float", "default": 3e-4},
        "gamma": {"type": "float", "default": 0.99},
        "policy": {"type": "str", "default": "MlpPolicy"},
        "seed": {"type": "int", "default": None},
    },
    "inputs": [{"name": "env", "dtype": "Environment"}],
    "outputs": [{"name": "model", "dtype": "RLModel"}],
    "template": _TEMPLATE,
}
