# Block Library Expansion

## Purpose

La bibliothèque de blocs couvre les exercices de base de l'IA : images (torchvision), datasets intégrés, clustering, NLP, RL (gymnasium), métriques et time series — avec des catégories nommées en français.

## Requirements

### Requirement: Blocs transforms fonctionnels
The system MUST ship `torchvision` as a dependency so the existing transforms blocks (`to_tensor`, `normalize`, `random_crop`, `random_flip`, `resize`) execute without import errors.

#### Scenario: Run d'un bloc normalize
- **WHEN** un pipeline utilisant `normalize` est exécuté
- **THEN** le bloc s'exécute sans ModuleNotFoundError

### Requirement: Type image et load_image
The type system MUST recognize `PIL.Image.Image` as the `image` family, convertible to `torch.Tensor` via `to_tensor`. The system MUST provide a `load_image` block that loads a stored image file into a `PIL.Image.Image`.

#### Scenario: Conversion image → tensor
- **WHEN** une image est connectée à `to_tensor`
- **THEN** la connexion est verte (conversion `image → tensor` disponible)

#### Scenario: Chargement d'une image
- **WHEN** l'utilisateur fournit un fichier image à `load_image`
- **THEN** le bloc retourne une `PIL.Image.Image`

### Requirement: Datasets intégrés
The system MUST provide `load_sklearn_dataset` (iris/digits/wine/breast_cancer → DataFrame) and `load_torch_dataset` (MNIST/FashionMNIST/CIFAR10 → DataLoader) so classic exercises run without file uploads.

#### Scenario: Classification iris
- **WHEN** un pipeline charge iris puis entraîne un classifieur
- **THEN** le run s'exécute et produit une métrique

#### Scenario: MNIST
- **WHEN** un pipeline charge MNIST (DataLoader) puis entraîne un MLP
- **THEN** le run s'exécute et produit une courbe de perte

### Requirement: Couverture des exercices
The system MUST provide blocks for: polynomial regression, k-means + silhouette, t-SNE, sequence windows (RNN/time series), NLP (tokenize, vocab, encode), confusion matrix, f1/precision/recall metrics, isolation forest (anomaly), and RL (gymnasium env, Q-learning, agent evaluation).

#### Scenario: Chaque exercice de la grille
- **WHEN** un pipeline est construit pour un exercice de la grille (classification, clustering, NLP, RL, séries)
- **THEN** il s'exécute en run local avec des sorties typées

### Requirement: Catégories en français
The block category folders MUST be named in French without underscores (format `{nom}-{hex}`). The registry MUST parse the folder name for the hex color and the French category id regardless of separator.

#### Scenario: Découverte après renommage
- **WHEN** les blocs sont découverts après le renommage des dossiers
- **THEN** les catégories affichent les ids français et leurs couleurs d'origine
