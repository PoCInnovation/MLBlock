def evaluate_agent(env: "Env", policy: "Policy", episodes: "int" = 10) -> "float":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Évaluer un agent.
    Joue plusieurs épisodes avec la politique apprise et retourne la récompense
    moyenne.

    Args:
        env: Environnement gymnasium.
        policy: Politique apprise (état → action).
        episodes: Nombre d'épisodes (entre: 1-50, pas: 1).
    """
    total = 0.0
    for _ in range(episodes):
        state, _ = env.reset()
        done = False
        while not done:
            action = policy(state)
            state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            total += reward
    return total / episodes
