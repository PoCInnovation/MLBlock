import gymnasium as gym
from gymnasium import spaces
import numpy as np


def BUILD(params):
    space_type = params.get("space_type", "Discrete")
    if space_type == "Discrete":
        return {"space": spaces.Discrete(n=params.get("n", 2))}
    elif space_type == "Box":
        low = np.array(eval(params.get("low", "[-1.0]")))
        high = np.array(eval(params.get("high", "[1.0]")))
        dtype = getattr(np, params.get("dtype", "float32"))
        return {"space": spaces.Box(low=low, high=high, dtype=dtype)}
    elif space_type == "MultiBinary":
        return {"space": spaces.MultiBinary(n=params.get("n", 2))}
    elif space_type == "MultiDiscrete":
        nvec = np.array(eval(params.get("n", "[2, 2]")))
        return {"space": spaces.MultiDiscrete(nvec=nvec)}
    return {"space": spaces.Discrete(n=2)}


BLOCK = {
    "label": "Définir un espace",
    "category": "environment",
    "params": {
        "space_type": {"type": "str", "default": "Discrete"},
        "n": {"type": "int", "default": None},
        "low": {"type": "str", "default": None},
        "high": {"type": "str", "default": None},
        "dtype": {"type": "str", "default": "float32"},
    },
    "inputs": [],
    "outputs": [{"name": "space", "dtype": "Space"}],
    "template": "{space_expr}",
}
