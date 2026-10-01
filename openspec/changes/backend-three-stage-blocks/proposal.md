# Proposal: Backend Three-Stage Pipeline, Curated Framework Stack & MLflow Tracking

## Why

La fragmentation actuelle du typage (6 micro-stages) et l'absence de traçabilité des exécutions freinaient l'apprentissage et le prototypage. De plus, les utilisateurs débutants comme avancés doivent disposer de **3 étapes universelles limpides** et de la liberté totale d'utiliser des blocs unitaires ou de composer des **SuperBlocks sur mesure** aux noms explicites ("Scratch pour le ML") avec le moteur entre parenthèses.
Cette spécification refonde le backend autour des 3 macro-étapes standard de l'industrie, intègre une stack de frameworks rigoureusement sélectionnée (Pandas, NumPy, Scikit-Learn, XGBoost, PyTorch, Gymnasium, MLflow, Plotly, Seaborn/Matplotlib), et garantit une étanchéité stricte par framework au sein des conteneurs.

## The 3 Canonical Pipeline Stages & Pédagogie Débutant

```
[ Étape 1 : Données / Environnement + Préparation ]
       │
       ▼
[ Étape 2 : Modèle + Entraînement ]  ◄── [ Suivi & Historique d'Expérience (MLflow) ]
       │
       ▼
[ Étape 3 : Évaluation + Visualisation ] ──► [ Modèles packagés & Graphes interactifs/statiques ]
```

1. **Étape 1 : Données / Environnement + Préparation**
   - **Rôle** : Ingestion des données brutes (fichiers CSV, images, textes), instanciation des environnements d'apprentissage (Gymnasium), nettoyage, imputation, encodage catégoriel, découpage train/test, normalisation / augmentation de données, et assemblage en lots itérables (`DataLoader`).
   - **Frameworks** : `Pandas`, `NumPy`, `Scikit-Learn` (preprocessing & model_selection), `Torchvision` (transforms), `Gymnasium` (envs).
   - **SuperBlocks Standardisés** :
     - `tabular_data_pipeline` : **Préparation Tabulaire (Scikit-Learn)**
     - `torch_data_pipeline` : **Chargement d'Images & Lots (PyTorch)**
     - `gym_env_pipeline` : **Monde Virtuel & Simulation (Gymnasium)**
     - `nlp_data_pipeline` : **Préparation de Texte (PyTorch)**

2. **Étape 2 : Modèle + Entraînement**
   - **Rôle** : Définition de l'architecture algorithmique (couches modulaires `nn.Module`, estimateurs statistiques, modèles de gradient boosting), sélection de la fonction de perte et de l'optimiseur, et exécution de la boucle d'apprentissage (`fit()` ou boucle d'époques PyTorch).
   - **Frameworks & SuperBlocks Standardisés** :
     - `sequential_model` : **Réseau de Neurones Séquentiel (PyTorch)**
     - `deep_trainer` : **Entraînement de Réseau (PyTorch)**
     - `sklearn_model_trainer` : **Modèle Statistique & Arbres (Scikit-Learn)**
     - `xgboost_trainer` : **Modèle de Boosting Rapide (XGBoost)**
     - `rl_agent_trainer` : **Apprentissage par Renforcement (Gymnasium)**
     - `mlflow_tracker` : **Suivi & Historique d'Expérience (MLflow)**

3. **Étape 3 : Évaluation + Visualisation**
   - **Rôle** : Calcul des métriques de performance (Accuracy, F1-score, Loss, Silhouette, Reward), tracés interactifs et statiques (matrices de confusion, courbes d'apprentissage, projections PCA / t-SNE) et packaging standardisé du modèle servable.
   - **Frameworks & SuperBlocks Standardisés** :
     - `deep_evaluator` : **Score & Courbes d'Apprentissage (Plotly / PyTorch)**
     - `confusion_matrix_eval` : **Matrice de Confusion & Précision (Seaborn / Scikit-Learn)**
     - `clustering_visualizer` : **Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)**
     - `agent_rollout_viewer` : **Score & Démonstration de l'Agent (Gymnasium / Plotly)**
     - `mlflow_model_exporter` : **Export de Modèle Prêt à l'Emploi (MLflow)**

---

## What Changes

- **Macro-Stages & Rétrocompatibilité Backend** :
  - Définir `MacroStage(IntEnum)` : `DATA = 1`, `MODEL_TRAIN = 2`, `RESULTS = 3`, `TRANSITION = 99`.
  - Attribuer un tag de framework strict (`engine`) à chaque bloc : `"sklearn"`, `"pytorch"`, `"gym"`, `"mlflow"`, `"viz"`, `"generic"`.
- **Nomenclature Pédagogique des SuperBlocks** :
  - Intitulés explicites avec framework entre parenthèses exposés dans les métadonnées de l'API catalog.
- **Intégration MLflow pour l'Expérimentation et le Packaging** :
  - Bloc optionnel d'étape 2 : `mlflow_tracker` injectant `mlflow.autolog()` dans le code généré.
  - Sauvegarde locale automatique des runs dans `./mlruns` sans coût d'infrastructure.
- **Ajout du Moteur XGBoost** :
  - Intégrer un bloc `xgboost_classifier` et `xgboost_regressor` pour couvrir le SOTA tabulaire.
- **Étanchéité des Frameworks au sein des SuperBlocks** :
  - La validation rejette formellement l'insertion de frameworks incompatibles au sein d'un même SuperBlock (ex: bloc Scikit-Learn dans un SuperBlock PyTorch sans adaptateur).
- **Choix Libre du Développeur (Blocs Libres vs SuperBlocks Sur Mesure)** :
  - Possibilité d'utiliser les blocs à l'état brut OU de créer des SuperBlocks sur mesure typés par framework.
- **Harmonisation des Couches Composables (`nn.Module`)** :
  - Convertir les activations (`sigmoid`, `tanh`, etc.) et normalisations (`batchnorm2d`, `dropout`) en couches composables continues.
- **Blocs de Transition / Traduction Dédiés** :
  - Identifier et enrichir `df_to_tensor`, `to_tensor`, `env_to_tensor`, `module_to_policy`.

## Capabilities

### New Capabilities
- `three-stage-catalog`: Classification par les 3 étapes universelles, typage par frameworks et noms pédagogiques de SuperBlocks.
- `mlflow-tracking`: Instrumentation de tracking et de packaging des modèles via MLflow.
- `custom-superblocks`: Création et validation de conteneurs sur mesure cloisonnés par moteur.
- `composable-layers`: Couches unifiées composables pour PyTorch.

### Modified Capabilities
- Aucune capacité de spec existante modifiée.
