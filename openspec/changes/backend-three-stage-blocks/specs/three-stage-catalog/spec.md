# Spec Delta: Backend Three-Stage Pipeline, Curated Frameworks & MLflow

## Purpose

Définit le catalogue en 3 macro-étapes, les règles de cloisonnement par framework, l'instrumentation MLflow et la nomenclature pédagogique des SuperBlocks ("Nom clair (Moteur)").

## ADDED Requirements

### Requirement: Les 3 Macro-Étapes Canoniques
Chaque bloc du catalogue doit être formellement rattaché à l'une des 3 macro-étapes :
- `MacroStage 1 (DATA)` : Données / Environnement + Préparation
- `MacroStage 2 (MODEL_TRAIN)` : Modèle + Entraînement
- `MacroStage 3 (RESULTS)` : Évaluation + Visualisation
- `MacroStage X (TRANSITION)` : Passerelles de conversion de types inter-frameworks

#### Scenario: Exposition du catalogue avec macro-étapes et moteurs
- **WHEN** un client appelle `GET /api/catalog`
- **THEN** chaque bloc spécifie son `macro_stage` (1, 2, 3 ou 99) et son framework (`engine: "sklearn" | "pytorch" | "gym" | "mlflow" | "viz" | "generic"`).

### Requirement: Nomenclature Pédagogique des SuperBlocks
Chaque SuperBlock standard exposé par le catalogue doit comporter un titre explicite et le nom de son moteur entre parenthèses :
- Étape 1 : `Préparation Tabulaire (Scikit-Learn)`, `Chargement d'Images & Lots (PyTorch)`, `Monde Virtuel & Simulation (Gymnasium)`, `Préparation de Texte (PyTorch)`.
- Étape 2 : `Réseau de Neurones Séquentiel (PyTorch)`, `Entraînement de Réseau (PyTorch)`, `Modèle Statistique & Arbres (Scikit-Learn)`, `Modèle de Boosting Rapide (XGBoost)`, `Apprentissage par Renforcement (Gymnasium)`, `Suivi & Historique d'Expérience (MLflow)`.
- Étape 3 : `Score & Courbes d'Apprentissage (Plotly / PyTorch)`, `Matrice de Confusion & Précision (Seaborn / Scikit-Learn)`, `Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)`, `Score & Démonstration de l'Agent (Gymnasium / Plotly)`, `Export de Modèle Prêt à l'Emploi (MLflow)`.

#### Scenario: Titres des SuperBlocks dans l'API
- **WHEN** un client inspecte les SuperBlocks renvoyés par `/api/catalog`
- **THEN** les champs `label` et `title` affichent le format `Action Concrète (Nom du Moteur)`.

### Requirement: Support de MLflow dans la génération de code
Lorsqu'un bloc de tracking MLflow est présent dans le graphe ou activé par le pipeline, le générateur de code doit injecter l'initialisation et l'autologging MLflow.

#### Scenario: Génération de code avec MLflow
- **WHEN** un pipeline contient le bloc `mlflow_tracker` connecté à une étape d'entraînement
- **THEN** le code généré importe `mlflow`, configure `mlflow.set_experiment(...)` et appelle `mlflow.autolog()` avant la boucle de `train_model` ou `fit()`.

### Requirement: Étanchéité Stricte des Frameworks dans les SuperBlocks
Un SuperBlock (standard ou créé sur mesure) ne doit contenir que des blocs compatibles avec son moteur d'exécution déclaré.

#### Scenario: Rejet d'un mélange de frameworks sans passerelle
- **WHEN** un conteneur typé `engine: "pytorch"` contient un bloc `xgboost_classifier` ou `logistic_regression`
- **THEN** la validation du conteneur échoue avec une erreur explicite signalant l'incompatibilité de framework.

### Requirement: SuperBlocks Sur Mesure par le Développeur
Le backend doit valider et exécuter n'importe quel conteneur créé dynamiquement par l'utilisateur via son tableau `children`.

#### Scenario: Exécution d'un conteneur personnalisé
- **WHEN** un pipeline contenant un SuperBlock personnalisé valide est soumis à `POST /api/pipelines/{id}/execute`
- **THEN** le runtime exécute les nœuds enfants de manière séquentielle et transmet les sorties au reste du graphe.
