## 1. Dépendances & type image

- [x] 1.1 pyproject : `torchvision` + `gymnasium` ; `uv sync` ; run local des 5 blocs transforms (normalize sur tensor CHW)
- [x] 1.2 `core/types.py` : famille `image` (PIL.Image.Image) + familles `list`, `env`, `policy` ; graphe de conversion `image → tensor` (to_tensor)
- [x] 1.3 `to_tensor` : annotation d'entrée `PIL.Image.Image` (conversion image → tensor)
- [x] 1.4 `load_image` (donnees) : param file → télécharge URL storage → PIL.Image
- [x] 1.5 Build : shape CHW pour les racines image

## 2. Datasets intégrés

- [x] 2.1 `load_sklearn_dataset` (donnees) : iris/digits/wine/breast_cancer → DataFrame (features + target)
- [x] 2.2 `load_torch_dataset` (donnees) : MNIST/FashionMNIST/CIFAR10 → DataLoader (batch_size, split, download auto)

## 3. Nouveaux blocs par exercice

- [x] 3.1 `polynomial_features` (transformations) : degré → colonnes polynomiales
- [x] 3.2 `kmeans` (modeles) + `silhouette` (entrainement) : clustering + score
- [x] 3.3 `tsne` (modeles) : réduction → ndarray
- [x] 3.4 `sequence_dataset` (donnees) : fenêtres glissantes → DataLoader
- [x] 3.5 NLP : `tokenize`, `build_vocab`, `encode_text` (texte) : str → list → dict → ndarray
- [x] 3.6 Métriques : `confusion_matrix` (entrainement) + evaluate étendu (f1/precision/recall via sklearn.metrics)
- [x] 3.7 `isolation_forest` (modeles) : anomalie
- [x] 3.8 RL : `create_env`, `q_learning`, `evaluate_agent` (renforcement) — gymnasium, Q-table
- [x] 3.9 Docstrings FR structurées pour les 13 nouveaux blocs (convention existante)

## 4. Renommage français des dossiers

- [x] 4.1 Registry : `_color_from_folder` accepte `-` ou rien avant le suffixe hex ; `cat_name` par regex (sans dépendre du `_`)
- [x] 4.2 `git mv` des 11 dossiers : donnees, chargement, modeles, activation, convolution, normalisation, regroupement, sequences, entrainement, transformations, visualisation + nouveaux texte, renforcement
- [x] 4.3 `test_block.py` : références de catégories mises à jour ; test de découverte après renommage

## 5. Vérification — un run local par exercice

- [x] 5.1 Classification iris (load_sklearn_dataset → train_test_split → random_forest → evaluate accuracy)
- [x] 5.2 CNN/MNIST (load_torch_dataset → conv2d → pool → flatten → linear → train_model → courbe)
- [x] 5.3 Clustering (load_sklearn_dataset → kmeans → silhouette)
- [x] 5.4 NLP (tokenize → build_vocab → encode_text → …)
- [x] 5.5 RL (create_env → q_learning → evaluate_agent) — CartPole récompense moyenne
- [x] 5.6 Séries (load_sklearn_dataset → sequence_dataset → rnn → train_model)
- [x] 5.7 Build frontend + suite backend (`uv run python -m pytest`)
