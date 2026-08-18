def create_env(env_id: "str" = "CartPole-v1") -> "Env":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Créer un environnement.
    Crée un environnement d'apprentissage par renforcement (gymnasium).

    Args:
        env_id: Identifiant de l'environnement (choix: CartPole-v1|MountainCar-v0|Acrobot-v1).
    """
    import gymnasium as gym

    return gym.make(env_id)
