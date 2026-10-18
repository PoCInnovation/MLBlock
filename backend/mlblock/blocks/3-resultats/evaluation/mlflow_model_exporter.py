def mlflow_model_exporter(model: "Model", artifact_path: "str" = "model") -> "str":  # noqa: F821 -- annotation descriptive en chaîne (métadonnées DSL, noms virtuels)
    """Export MLflow.
    Exporte le modèle entraîné au format MLflow, prêt à l'emploi.

    Args:
        model: Modèle entraîné à exporter.
        artifact_path: Chemin de l'artefact. (format: ./mlruns-export)
    """
    import mlflow
    try:
        import torch.nn as nn
        is_torch = isinstance(model, nn.Module)
    except Exception:
        is_torch = False
    if is_torch:
        mlflow.pytorch.save_model(model, artifact_path)
    else:
        mlflow.sklearn.save_model(model, artifact_path)
    return artifact_path
