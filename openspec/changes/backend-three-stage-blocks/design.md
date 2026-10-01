# Design: Backend Three-Stage Pipeline, Curated Frameworks & MLflow

## Context

Voir `proposal.md` pour le détail de l'architecture.
Ce document détaille l'intégration de MLflow et la formalisation des 3 étapes canoniques.

## Goals / Non-Goals

**Goals:**
- Mettre en place `MacroStage(IntEnum)` et mapper les 13 dossiers de blocs existants sur les 3 macro-étapes.
- Introduire le support de `MLflow` (autologging local dans `./mlruns`).
- Ajouter les blocs `xgboost_classifier` et `xgboost_regressor`.
- Valider le cloisonnement par moteur (`engine`) dans `validation.py`.
- Rendre les couches de réseaux PyTorch rigoureusement composables (`nn.Module`).

**Non-Goals:**
- L'interface de consultation avancée des runs MLflow dans le frontend (l'utilisateur peut lancer `mlflow ui` localement ou inspecter les logs exportés).

## Decisions

1. **Intégration de MLflow** :
   - Dépendance `mlflow` ajoutée dans `pyproject.toml`.
   - Nouveau bloc `mlflow_tracker` dans la catégorie entraînement (Étape 2) :
     ```python
     def mlflow_tracker(experiment_name: str = "default_experiment", run_name: str | None = None) -> None:
         import mlflow
         mlflow.set_tracking_uri("file:./mlruns")
         mlflow.set_experiment(experiment_name)
         mlflow.autolog()
     ```
   - Le script généré par `generator.py` initialise automatiquement la trace et enregistre les artefacts.

2. **Cartographie des Moteurs (`engine`)** :
   - `sklearn` : `load_csv`, `load_sklearn_dataset`, `train_test_split`, `standard_scaler`, `logistic_regression`, `random_forest`, `decision_tree`, `svm`, `linear_regression`, `kmeans`, `pca`, `tsne`, `evaluate`, `confusion_matrix`.
   - `pytorch` : `load_torch_dataset`, `normalize`, `random_crop`, `random_flip`, `data_loader`, `conv2d_layer`, `linear_layer`, `relu_layer`, `maxpool2d_layer`, `flatten_layer`, `batchnorm2d_layer`, `dropout_layer`, `lstm_layer`, `rnn_layer`, `adam`, `sgd`, `cross_entropy_loss`, `mse_loss`, `train_model`.
   - `gym` : `create_env`, `q_learning`, `evaluate_agent`.
   - `mlflow` : `mlflow_tracker`, `mlflow_model_logger`.
   - `viz` : `plot_predictions`, `loss_curve`, `confusion_matrix`.
   - `transition` : `df_to_tensor`, `to_tensor`, `env_to_tensor`, `module_to_policy`.

3. **Validation d'Étanchéité des SuperBlocks** :
   - `validate_container_children` vérifie que les blocs enfants ont un moteur compatible avec le conteneur.
   - Les blocs marqués `is_transition: true` sont autorisés à la frontière du conteneur.

## Risks / Trade-offs

- Taille de la dépendance MLflow : MLflow est léger en local (pas de démon obligatoire) et s'installe très rapidement via `uv`.
