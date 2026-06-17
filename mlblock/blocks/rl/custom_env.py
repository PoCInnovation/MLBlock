import gymnasium as gym
from gymnasium import spaces
import numpy as np


class _CustomEnv(gym.Env):
    def __init__(self, render_mode=None):
        super().__init__()
        self.action_space = spaces.Discrete(2)
        self.observation_space = spaces.Box(low=0, high=1, shape=(4,), dtype=np.float32)
        self.render_mode = render_mode

    def reset(self, seed=None, options=None):
        return self.observation_space.sample(), {}

    def step(self, action):
        return self.observation_space.sample(), 0.0, False, False, {}

    def render(self):
        pass


def BUILD(params):
    name = params.get("env_name", "CustomEnv")
    render_mode = params.get("render_mode")
    return {"env": _CustomEnv(render_mode=render_mode)}


BLOCK = {
    "label": "Environnement personnalisé",
    "category": "environment",
    "params": {
        "env_name": {"type": "str", "default": "CustomEnv"},
        "render_mode": {"type": "str", "default": None},
    },
    "inputs": [],
    "outputs": [{"name": "env", "dtype": "Environment"}],
    "template": "",
}
