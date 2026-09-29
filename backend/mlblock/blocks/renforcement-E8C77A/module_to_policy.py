def module_to_policy(in_1: "torch.nn.Module") -> "Policy":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Module to Policy.
    Enveloppe un réseau entraîné en politique actionnable (pont S2 → SX).

    Args:
        in_1: Réseau entraîné (Q-network).
    """
    import numpy as np
    import torch

    in_1.eval()

    def policy(state):
        with torch.no_grad():
            q = in_1(torch.from_numpy(np.asarray(state, dtype="float32")).unsqueeze(0))
            return int(q.argmax().item())

    return policy
