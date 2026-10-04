def mlflow_tracker(experiment_name: "str" = "default_experiment", run_name: "str | None" = None) -> None:  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Suivi MLflow.
    Active le suivi et l'historique d'expérience MLflow (autologging local).

    Args:
        experiment_name: Nom de l'expérience.
        run_name: Nom du run (optionnel).
    """
    import mlflow
    mlflow.set_tracking_uri("file:./mlruns")
    mlflow.set_experiment(experiment_name)
    mlflow.autolog()
