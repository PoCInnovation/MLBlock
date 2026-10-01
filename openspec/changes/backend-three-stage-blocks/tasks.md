# Tasks: Backend Three-Stage Pipeline, Curated Frameworks & MLflow

## 1. Modèle de Données & Intégration Frameworks

- [ ] 1.1 Définir `MacroStage(IntEnum)` (1: DATA, 2: MODEL_TRAIN, 3: RESULTS, 99: TRANSITION) dans `backend/mlblock/core/stages.py`
- [ ] 1.2 Ajouter les dépendances `mlflow` et `xgboost` dans `backend/pyproject.toml`
- [ ] 1.3 Créer les blocs XGBoost (`xgboost_classifier`, `xgboost_regressor`) dans `modeles-F59E0B`
- [ ] 1.4 Créer le bloc `mlflow_tracker` pour activer `mlflow.autolog()` dans `entrainement-DE497D`
- [ ] 1.5 Mettre à jour `catalog.py` / `registry.py` pour attribuer `macro_stage`, `engine` et `is_transition` à tous les blocs

## 2. Validation des Macro-Étapes & SuperBlocks Sur Mesure

- [ ] 2.1 Implémenter le contrôle d'incompatibilité de framework dans `validate_container_children` (`validation.py`)
- [ ] 2.2 Supporter la validation et la composition libre de SuperBlocks personnalisés créés par le développeur
- [ ] 2.3 Mettre à jour `generator.py` pour injecter le setup MLflow dans le script Python lorsque le bloc `mlflow_tracker` est actif

## 3. Couches Composables & Validation des 12 Exercices

- [ ] 3.1 Convertir les activations secondaires (`sigmoid`, `tanh`, `elu`, `gelu`, `leaky_relu`, `softmax`) en couches composables `nn.Module`
- [ ] 3.2 Convertir les normalisations (`batchnorm1d`, `batchnorm2d`, `layernorm`) en couches composables `nn.Module`
- [ ] 3.3 Créer `dropout_layer` composable et ajouter les alias rétrocompatibles dans `adapters.py`
- [ ] 3.4 Vérifier la couverture des 12 exercices canoniques via `scripts/audit_coverage.py`
- [ ] 3.5 Lancer `uv run pytest mlblock/tests -q` et `uv run ruff check .`
