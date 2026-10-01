# Spec Delta: Frontend Three-Stage Palette, Engine SuperBlocks & Gradient Transitions

## Purpose

Définit le comportement interactif de la palette à 3 étapes, les filtres par framework (Scikit-Learn/XGBoost, PyTorch, Gymnasium, MLflow/Viz), les intitulés clairs de SuperBlocks avec moteur entre parenthèses, la création de SuperBlocks sur mesure et le rendu en dégradé bicolore.

## ADDED Requirements

### Requirement: Navigation de la Palette en 3 Macro-Étapes
La palette de blocs doit organiser le catalogue en 3 sections d'étapes :
1. `Données / Environnement & Préparation`
2. `Modèle & Entraînement`
3. `Évaluation & Visualisation`

#### Scenario: Sélection d'un filtre d'étape
- **WHEN** l'utilisateur clique sur la section "Modèle & Entraînement"
- **THEN** seuls les blocs et SuperBlocks d'architecture, d'entraînement et de tracking MLflow sont présentés.

### Requirement: Intitulés Pédagogiques des SuperBlocks
Tous les SuperBlocks de la palette et du canvas doivent porter leur intitulé clair suivi de leur moteur entre parenthèses :
- `Préparation Tabulaire (Scikit-Learn)`
- `Chargement d'Images & Lots (PyTorch)`
- `Monde Virtuel & Simulation (Gymnasium)`
- `Préparation de Texte (PyTorch)`
- `Réseau de Neurones Séquentiel (PyTorch)`
- `Entraînement de Réseau (PyTorch)`
- `Modèle Statistique & Arbres (Scikit-Learn)`
- `Modèle de Boosting Rapide (XGBoost)`
- `Apprentissage par Renforcement (Gymnasium)`
- `Suivi & Historique d'Expérience (MLflow)`
- `Score & Courbes d'Apprentissage (Plotly / PyTorch)`
- `Matrice de Confusion & Précision (Seaborn / Scikit-Learn)`
- `Visualisation de Groupes & Carte 2D (Plotly / Scikit-Learn)`
- `Score & Démonstration de l'Agent (Gymnasium / Plotly)`
- `Export de Modèle Prêt à l'Emploi (MLflow)`

#### Scenario: Affichage du titre d'un SuperBlock
- **WHEN** un nœud SuperBlock est affiché dans la palette ou posé sur le canvas
- **THEN** son titre affiche le nom d'action suivi de son framework entre parenthèses.

### Requirement: Filtrage par Framework et Moteur
La palette doit proposer des filtres d'écosystème : `Tous`, `PyTorch`, `Scikit-Learn & XGBoost`, `Gymnasium RL`, `MLflow & Viz`.

#### Scenario: Filtrage par framework
- **WHEN** le filtre "Scikit-Learn & XGBoost" est actif
- **THEN** les blocs PyTorch (convolutions, layers, tenseurs) sont masqués, laissant visibles uniquement les flux tabulaires et leurs SuperBlocks.

### Requirement: Création Libre de SuperBlocks Personnalisés
L'interface doit permettre d'encapsuler un ensemble de blocs sélectionnés sur le canvas dans un SuperBlock sur mesure.

#### Scenario: Création d'un SuperBlock et validation du moteur
- **WHEN** l'utilisateur sélectionne plusieurs blocs et clique sur "Créer SuperBlock"
- **THEN** un tiroir permet de nommer le SuperBlock, choisir sa macro-étape et son moteur hôte.
- **WHEN** la sélection contient des blocs de frameworks incompatibles sans bloc de transition
- **THEN** l'interface signale l'erreur et empêche la création tant que le conflit de framework n'est pas résolu.

### Requirement: Style des Éléments de Transition en Dégradé Bicolore
Les nœuds et arêtes de transition inter-frameworks doivent être stylisés avec un dégradé reliant les couleurs respectives des deux moteurs.

#### Scenario: Rendu d'une arête de transition
- **WHEN** une connexion relie un nœud Scikit-Learn (bleu) à un convertisseur `df_to_tensor` puis vers un nœud PyTorch (orange)
- **THEN** l'arête et le nœud de transition sont rendus avec le dégradé bicolore bleu -> orange.
