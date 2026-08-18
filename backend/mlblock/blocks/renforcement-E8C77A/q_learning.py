import numpy as np


def q_learning(env: "Env", episodes: "int" = 500, lr: "float" = 0.1, gamma: "float" = 0.99) -> "Policy":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Apprendre par Q-learning.
    Entraîne une table Q sur un environnement discret (CartPole, MountainCar…).

    Args:
        env: Environnement gymnasium.
        episodes: Nombre d'épisodes (entre: 100-2000, pas: 100).
        lr: Taux d'apprentissage (entre: 0.01-0.5, pas: 0.01).
        gamma: Facteur d'actualisation (entre: 0.9-0.999, pas: 0.001).
    """
    rng = np.random.default_rng(42)
    n_actions = env.action_space.n
    bins = 10

    def discretize(state):
        lo = env.observation_space.low
        hi = env.observation_space.high
        safe_lo = np.where(np.isfinite(lo), lo, -1.0)
        safe_hi = np.where(np.isfinite(hi), hi, 1.0)
        scale = (safe_hi - safe_lo) / bins
        return tuple(np.clip(((state - safe_lo) / scale).astype(int), 0, bins - 1))

    q = np.zeros((bins,) * len(discretize(env.reset()[0])) + (n_actions,))
    for _ in range(episodes):
        state, _ = env.reset()
        done = False
        while not done:
            s = discretize(state)
            action = rng.integers(n_actions) if rng.random() < 0.1 else int(np.argmax(q[s]))
            nxt, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            ns = discretize(nxt)
            q[s][action] += lr * (reward + gamma * float(np.max(q[ns])) - q[s][action])
            state = nxt

    def policy(state):
        s = discretize(state)
        return int(np.argmax(q[s]))

    return policy
