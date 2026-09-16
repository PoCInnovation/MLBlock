def env_to_tensor(env: "Env", episodes: "int" = 100) -> "torch.Tensor":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Environment to Tensor.
    Échantillonne des états de l'environnement en tenseur d'observations (pont SX → S1).

    Args:
        env: Environnement gymnasium.
        episodes: États à échantillonner. (entre: 10-1000, pas: 10)
    """
    import numpy as np
    import torch

    states = []
    for _ in range(episodes):
        state, _ = env.reset()
        states.append(np.asarray(state, dtype="float32"))
    return torch.from_numpy(np.stack(states))
